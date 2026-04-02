import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";
import { Resend } from "resend";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const replySchema = z.object({
  threadId: z.string().min(1).optional(),
  to: z.string().email().optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1),
  cc: z.string().optional().nullable(),
  fromAddressId: z.string().optional().nullable(),
}).refine(
  (d) => d.threadId || (d.to && d.subject),
  { message: "Either threadId or both to and subject are required" }
);

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  const currentUserId = session?.user?.id as string | undefined;

  if (!currentUserId || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Replies are part of viewing a thread; require `email_view` rather than full mailbox management.
  if (!canAccessRoute("/admin/email/thread", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = replySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend is not configured (missing RESEND_API_KEY)" }, { status: 503 });
  }

  const { threadId, to: toAddress, subject: inputSubject, bodyHtml, cc, fromAddressId } = parsed.data;

  let thread = threadId
    ? await prisma.emailThread.findUnique({
        where: { id: threadId },
        include: {
          mailbox: { select: { id: true, address: true, label: true } },
        },
      })
    : null;

  if (threadId && !thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const hasEmailManage = (permissions ?? []).includes("email_manage");
  const isFullAccess = role === "ADMIN" || role === "SUPER_ADMIN" || hasEmailManage;
  if (!isFullAccess && thread) {
    const canSee =
      thread.assignedToId === currentUserId ||
      (await prisma.emailMailboxViewer.findFirst({
        where: { userId: currentUserId, mailboxId: thread.mailbox.id },
        select: { id: true },
      }))
        ? true
        : false;

    if (!canSee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fromMailbox =
    fromAddressId && fromAddressId !== (thread?.mailbox?.id ?? "")
      ? await prisma.emailAddress.findUnique({
          where: { id: fromAddressId },
          select: { id: true, address: true, label: true, isActive: true },
        })
      : thread?.mailbox ?? null;

  if (!fromMailbox) {
    // For standalone compose, try the specified fromAddressId directly
    if (fromAddressId) {
      const mb = await prisma.emailAddress.findUnique({
        where: { id: fromAddressId },
        select: { id: true, address: true, label: true, isActive: true },
      });
      if (!mb) return NextResponse.json({ error: "From mailbox not found" }, { status: 404 });
      if (!mb.isActive) return NextResponse.json({ error: "From mailbox is inactive" }, { status: 400 });
      // Use mb as the mailbox for creating the new thread
      if (!thread && toAddress && inputSubject) {
        thread = await prisma.emailThread.create({
          data: {
            createdById: currentUserId,
            isActive: true,
            label: mb.label,
            subject: inputSubject.replace(/^(re|fwd|fw)\s*:\s*/gi, "").trim(),
            customerName: null,
            customerEmail: toAddress.toLowerCase(),
            mailboxId: mb.id,
            assignedToId: null,
            hasUnread: false,
            status: "OPEN",
          },
          include: { mailbox: { select: { id: true, address: true, label: true } } },
        });
      } else {
        return NextResponse.json({ error: "From mailbox not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "From mailbox not found" }, { status: 404 });
    }
  } else {
    if ("isActive" in fromMailbox && fromMailbox.isActive === false) {
      return NextResponse.json({ error: "From mailbox is inactive" }, { status: 400 });
    }
    // Create new thread for standalone compose
    if (!thread && toAddress && inputSubject) {
      thread = await prisma.emailThread.create({
        data: {
          createdById: currentUserId,
          isActive: true,
          label: fromMailbox.label,
          subject: inputSubject.replace(/^(re|fwd|fw)\s*:\s*/gi, "").trim(),
          customerName: null,
          customerEmail: toAddress.toLowerCase(),
          mailboxId: fromMailbox.id,
          assignedToId: null,
          hasUnread: false,
          status: "OPEN",
        },
        include: { mailbox: { select: { id: true, address: true, label: true } } },
      });
    }
  }

  if (!thread) return NextResponse.json({ error: "Could not resolve thread" }, { status: 400 });

  const resolvedMailbox = fromMailbox && "isActive" in fromMailbox ? fromMailbox : thread.mailbox;

  const to = thread.customerEmail;
  const subject = `Re: ${thread.subject}`;
  const ccList = (cc ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const resend = new Resend(process.env.RESEND_API_KEY);

  const resendPayload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string[] | string;
  } = {
    from: `${resolvedMailbox.label} <${resolvedMailbox.address}>`,
    to: [to],
    subject,
    html: bodyHtml,
  };

  if (ccList.length > 0) resendPayload.cc = ccList;

  // Provide a plain text fallback (some clients prefer it).
  resendPayload.text = stripHtml(bodyHtml);

  const { data, error } = await resend.emails.send(resendPayload as unknown as {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string[] | string;
  });
  if (error) {
    return NextResponse.json({ error: "Failed to send reply via Resend" }, { status: 502 });
  }

  const resendMessageId: string | null =
    typeof (data as { id?: unknown } | undefined)?.id === "string"
      ? ((data as { id?: unknown }).id as string)
      : null;

  const replyEmail = await prisma.$transaction(async (tx) => {
    await tx.email.updateMany({
      where: { threadId: thread.id, direction: "INBOUND", isRead: false },
      data: { isRead: true },
    });

    const created = await tx.email.create({
      data: {
        threadId: thread.id,
        direction: "OUTBOUND",
        isRead: true,
        resendMessageId,
        bodyHtml,
        bodyText: resendPayload.text ?? null,
        subject,
        cc: ccList.length ? ccList.join(",") : null,
        toAddress: to,
        fromAddress: resolvedMailbox.address,
        attachments: [],
      },
    });

    await tx.emailThread.update({
      where: { id: thread.id },
      data: { hasUnread: false },
    });

    return created;
  });

  return NextResponse.json({ success: true, emailId: replyEmail.id, threadId: thread.id });
}

