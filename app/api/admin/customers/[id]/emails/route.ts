import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Resend } from "resend";
import { z } from "zod";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

type SessionUser = {
  id?: string;
  role?: string;
  permissions?: string[];
};

const sendSchema = z.object({
  threadId: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  bodyHtml: z.string().min(1),
  cc: z.string().optional().nullable(),
  fromAddressId: z.string().optional().nullable(),
});

function normalizeSubject(subject: string): string {
  return (subject ?? "").replace(/^(re|fwd|fw)\s*:\s*/gi, "").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getVisibilityContext(user: SessionUser) {
  const role = user.role ?? "";
  const permissions = user.permissions ?? [];
  const currentUserId = user.id ?? "";
  const hasEmailManage = permissions.includes("email_manage");
  const isFullAccess = role === "ADMIN" || role === "SUPER_ADMIN" || hasEmailManage;

  const allowedMailboxIds = isFullAccess
    ? undefined
    : (
        await prisma.emailMailboxViewer.findMany({
          where: { userId: currentUserId },
          select: { mailboxId: true },
        })
      ).map((r) => r.mailboxId);

  return { role, permissions, currentUserId, isFullAccess, allowedMailboxIds };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const user = (session?.user as SessionUser | undefined) ?? {};

  if (!user.id || !user.role || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/customers", user.role, user.permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canAccessRoute("/admin/email/thread", user.role, user.permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const { currentUserId, isFullAccess, allowedMailboxIds } = await getVisibilityContext(user);

  const threads = await prisma.emailThread.findMany({
    where: {
      isActive: true,
      customerEmail: customer.email.toLowerCase(),
      ...(isFullAccess
        ? {}
        : {
            OR: [
              { assignedToId: currentUserId },
              { mailboxId: { in: allowedMailboxIds ?? [] } },
            ],
          }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      mailbox: { select: { id: true, label: true, address: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      emails: {
        orderBy: { sentAt: "asc" },
        select: {
          id: true,
          direction: true,
          isRead: true,
          sentAt: true,
          bodyHtml: true,
          bodyText: true,
          subject: true,
          cc: true,
          toAddress: true,
          fromAddress: true,
          attachments: true,
        },
      },
    },
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    },
    threads: threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      hasUnread: t.hasUnread,
      updatedAt: t.updatedAt.toISOString(),
      mailbox: t.mailbox,
      assignedTo: t.assignedTo
        ? { id: t.assignedTo.id, name: t.assignedTo.name, email: t.assignedTo.email }
        : null,
      emails: t.emails.map((e) => ({
        id: e.id,
        direction: e.direction,
        isRead: e.isRead,
        sentAt: e.sentAt.toISOString(),
        bodyHtml: e.bodyHtml,
        bodyText: e.bodyText,
        subject: e.subject,
        cc: e.cc,
        toAddress: e.toAddress,
        fromAddress: e.fromAddress,
        attachments: e.attachments,
      })),
    })),
    mailboxes: await prisma.emailAddress.findMany({
      where: {
        isActive: true,
        ...(isFullAccess ? {} : { id: { in: allowedMailboxIds ?? [] } }),
      },
      select: { id: true, address: true, label: true },
      orderBy: { createdAt: "desc" },
    }),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const user = (session?.user as SessionUser | undefined) ?? {};

  if (!user.id || !user.role || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/customers", user.role, user.permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canAccessRoute("/admin/email/thread", user.role, user.permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Resend is not configured (missing RESEND_API_KEY)" },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = sendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: { id: true, email: true, name: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const { currentUserId, isFullAccess, allowedMailboxIds } = await getVisibilityContext(user);
  const { threadId, subject, bodyHtml, cc, fromAddressId } = parsed.data;

  let thread = threadId
    ? await prisma.emailThread.findFirst({
        where: {
          id: threadId,
          customerEmail: customer.email.toLowerCase(),
          ...(isFullAccess
            ? {}
            : {
                OR: [
                  { assignedToId: currentUserId },
                  { mailboxId: { in: allowedMailboxIds ?? [] } },
                ],
              }),
        },
        include: { mailbox: { select: { id: true, address: true, label: true, isActive: true } } },
      })
    : null;

  if (threadId && !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  let mailbox =
    fromAddressId && fromAddressId.trim()
      ? await prisma.emailAddress.findFirst({
          where: {
            id: fromAddressId.trim(),
            isActive: true,
            ...(isFullAccess ? {} : { id: { in: allowedMailboxIds ?? [] } }),
          },
          select: { id: true, address: true, label: true, isActive: true },
        })
      : thread?.mailbox ?? null;

  if (!mailbox) {
    mailbox = await prisma.emailAddress.findFirst({
      where: {
        isActive: true,
        ...(isFullAccess ? {} : { id: { in: allowedMailboxIds ?? [] } }),
      },
      select: { id: true, address: true, label: true, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!mailbox) {
    return NextResponse.json(
      { error: "No active mailbox available. Create and grant a mailbox first." },
      { status: 400 }
    );
  }

  const canonicalSubject = normalizeSubject(subject ?? thread?.subject ?? "");
  if (!canonicalSubject) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }

  if (!thread) {
    thread = await prisma.emailThread.create({
      data: {
        createdById: currentUserId,
        isActive: true,
        label: mailbox.label,
        subject: canonicalSubject,
        customerName: customer.name,
        customerEmail: customer.email.toLowerCase(),
        mailboxId: mailbox.id,
        assignedToId: null,
        hasUnread: false,
        status: "OPEN",
      },
      include: { mailbox: { select: { id: true, address: true, label: true, isActive: true } } },
    });
  }

  const ccList = (cc ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const resend = new Resend(process.env.RESEND_API_KEY);
  const outgoingSubject = `Re: ${thread.subject}`;
  const text = stripHtml(bodyHtml);

  const { data, error } = await resend.emails.send({
    from: `${mailbox.label} <${mailbox.address}>`,
    to: [customer.email],
    subject: outgoingSubject,
    html: bodyHtml,
    text,
    ...(ccList.length ? { cc: ccList } : {}),
  });
  if (error) {
    return NextResponse.json({ error: "Failed to send reply via Resend" }, { status: 502 });
  }

  const resendMessageId =
    typeof (data as { id?: unknown } | undefined)?.id === "string"
      ? ((data as { id?: unknown }).id as string)
      : null;

  const sent = await prisma.$transaction(async (tx) => {
    await tx.email.updateMany({
      where: { threadId: thread!.id, direction: "INBOUND", isRead: false },
      data: { isRead: true },
    });

    const created = await tx.email.create({
      data: {
        threadId: thread!.id,
        direction: "OUTBOUND",
        isRead: true,
        resendMessageId,
        bodyHtml,
        bodyText: text || null,
        subject: outgoingSubject,
        cc: ccList.length ? ccList.join(",") : null,
        toAddress: customer.email,
        fromAddress: mailbox.address,
        attachments: [],
      },
      select: { id: true },
    });

    await tx.emailThread.update({
      where: { id: thread!.id },
      data: { hasUnread: false, status: "OPEN" },
    });

    return created;
  });

  return NextResponse.json({ success: true, emailId: sent.id, threadId: thread.id });
}

