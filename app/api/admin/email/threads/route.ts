import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";
import { Prisma, ThreadStatus } from "@prisma/client";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSnippet(email: { bodyText: string | null | undefined; bodyHtml: string | null | undefined }): string {
  const text = email.bodyText ?? (email.bodyHtml ? stripHtml(email.bodyHtml) : "");
  return text.length > 220 ? text.slice(0, 220) + "…" : text;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  const currentUserId = session?.user?.id as string | undefined;

  if (!currentUserId || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/email/inbox", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hasEmailManage = (permissions ?? []).includes("email_manage");
  const isFullAccess = role === "ADMIN" || role === "SUPER_ADMIN" || hasEmailManage;
  const allowedMailboxIds = !isFullAccess
    ? (
        await prisma.emailMailboxViewer.findMany({
          where: { userId: currentUserId },
          select: { mailboxId: true },
        })
      ).map((r) => r.mailboxId)
    : undefined;

  const url = new URL(req.url);
  const qp = url.searchParams;

  const folder = qp.get("folder") ?? "inbox";
  const statusParam = qp.get("status");
  const mailboxId = qp.get("mailboxId") ?? undefined;
  const assignedToId = qp.get("assignedToId") ?? undefined;
  const page = Math.max(1, Number(qp.get("page") ?? "1"));
  const limit = Math.max(1, Math.min(100, Number(qp.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where: Prisma.EmailThreadWhereInput = {};

  if (folder === "sent") {
    where.emails = {
      some: { direction: "OUTBOUND" }
    };
    where.status = "OPEN";
  } else if (folder === "trash") {
    where.status = "SPAM";
  } else {
    // inbox
    where.status = (statusParam as ThreadStatus) ?? ThreadStatus.OPEN;
  }
  if (mailboxId) where.mailboxId = mailboxId;
  if (assignedToId) where.assignedToId = assignedToId;

  const finalWhere: Prisma.EmailThreadWhereInput = {
    ...where,
    isActive: true,
    ...(isFullAccess
      ? {}
      : {
          AND: [
            {
              OR: [
                { assignedToId: currentUserId },
                { mailboxId: { in: allowedMailboxIds ?? [] } },
              ],
            },
          ],
        }),
  };

  const [total, threads] = await Promise.all([
    prisma.emailThread.count({ where: finalWhere }),
    prisma.emailThread.findMany({
      where: finalWhere,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        mailbox: { select: { id: true, label: true, address: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        emails: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { sentAt: true, direction: true, bodyText: true, bodyHtml: true, isRead: true },
        },
      },
    }),
  ]);

  const threadIds = threads.map((t) => t.id);
  const unreadCounts = await prisma.email.groupBy({
    by: ["threadId"],
    where: {
      threadId: { in: threadIds },
      direction: "INBOUND",
      isRead: false,
    },
    _count: { id: true },
  });
  const unreadMap = new Map(unreadCounts.map((r) => [r.threadId, r._count.id]));

  const serialized = threads.map((t) => {
    const latest = t.emails[0];
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      hasUnread: t.hasUnread,
      unreadCount: unreadMap.get(t.id) ?? 0,
      updatedAt: t.updatedAt.toISOString(),
      customerName: t.customerName,
      customerEmail: t.customerEmail,
      assignedTo: t.assignedTo
        ? { id: t.assignedTo.id, name: t.assignedTo.name, email: t.assignedTo.email }
        : null,
      mailbox: { id: t.mailbox.id, label: t.mailbox.label, address: t.mailbox.address },
      latestEmailAt: latest?.sentAt?.toISOString() ?? null,
      latestSnippet: latest ? getSnippet({ bodyText: latest.bodyText, bodyHtml: latest.bodyHtml }) : null,
      latestDirection: latest?.direction ?? null,
    };
  });

  return NextResponse.json({
    threads: serialized,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
}

