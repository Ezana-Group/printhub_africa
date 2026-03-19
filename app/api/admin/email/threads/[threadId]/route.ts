import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const patchSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "SPAM"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  const currentUserId = session?.user?.id as string | undefined;

  if (!currentUserId || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/email/thread", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { threadId } = await params;

  const hasEmailManage = (permissions ?? []).includes("email_manage");
  const isFullAccess = role === "ADMIN" || role === "SUPER_ADMIN" || hasEmailManage;
  const allowedMailboxIds = isFullAccess
    ? undefined
    : (
        await prisma.emailMailboxViewer.findMany({
          where: { userId: currentUserId },
          select: { mailboxId: true },
        })
      ).map((r) => r.mailboxId);

  // Re-fetch with full include once visibility constraint is applied.
  const finalThread = await prisma.emailThread.findFirst({
    where: isFullAccess
      ? { id: threadId }
      : {
          id: threadId,
          OR: [
            { assignedToId: currentUserId },
            { mailboxId: { in: allowedMailboxIds ?? [] } },
          ],
        },
    include: {
      mailbox: { select: { id: true, address: true, label: true } },
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

  if (!finalThread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    thread: {
      id: finalThread.id,
      subject: finalThread.subject,
      status: finalThread.status,
      hasUnread: finalThread.hasUnread,
      customerName: finalThread.customerName,
      customerEmail: finalThread.customerEmail,
      assignedToId: finalThread.assignedToId,
      assignedTo: finalThread.assignedTo
        ? { id: finalThread.assignedTo.id, name: finalThread.assignedTo.name, email: finalThread.assignedTo.email }
        : null,
      mailbox: finalThread.mailbox,
    },
    emails: finalThread.emails.map((e) => ({
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
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  const currentUserId = session?.user?.id as string | undefined;

  if (!currentUserId || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/email/settings", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { threadId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: { status?: "OPEN" | "CLOSED" | "SPAM"; assignedToId?: string | null } = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.assignedToId !== undefined) updateData.assignedToId = parsed.data.assignedToId;

  const hasEmailManage = (permissions ?? []).includes("email_manage");
  const isFullAccess = role === "ADMIN" || role === "SUPER_ADMIN" || hasEmailManage;
  const allowedMailboxIds = isFullAccess
    ? undefined
    : (
        await prisma.emailMailboxViewer.findMany({
          where: { userId: currentUserId },
          select: { mailboxId: true },
        })
      ).map((r) => r.mailboxId);

  const visibleThread = await prisma.emailThread.findFirst({
    where: isFullAccess
      ? { id: threadId }
      : {
          id: threadId,
          OR: [
            { assignedToId: currentUserId },
            { mailboxId: { in: allowedMailboxIds ?? [] } },
          ],
        },
    select: { id: true },
  });
  if (!visibleThread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.$transaction([
      prisma.email.updateMany({
        where: {
          threadId,
          direction: "INBOUND",
          isRead: false,
        },
        data: { isRead: true },
      }),
      prisma.emailThread.update({
        where: { id: threadId },
        data: {
          ...(updateData.status ? { status: updateData.status } : {}),
          ...(parsed.data.assignedToId !== undefined ? { assignedToId: updateData.assignedToId } : {}),
          hasUnread: false,
        },
      }),
    ]);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update thread", details: String(e) }, { status: 500 });
  }

  const thread = await prisma.emailThread.findUnique({
    where: { id: threadId },
    include: {
      mailbox: { select: { id: true, address: true, label: true } },
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

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    thread: {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      hasUnread: thread.hasUnread,
      customerName: thread.customerName,
      customerEmail: thread.customerEmail,
      assignedToId: thread.assignedToId,
      assignedTo: thread.assignedTo
        ? { id: thread.assignedTo.id, name: thread.assignedTo.name, email: thread.assignedTo.email }
        : null,
      mailbox: thread.mailbox,
    },
    emails: thread.emails.map((e) => ({
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
  });
}

