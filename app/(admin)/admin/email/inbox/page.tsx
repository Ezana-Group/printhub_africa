import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { EmailInboxThreePane } from "@/components/admin/email/email-inbox-three-pane";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function AdminEmailInboxPage() {
  await requireAdminSection("/admin/email/inbox");

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role as string;
  const currentUserId = session?.user?.id as string;
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
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

  const emailThreadWhere: Prisma.EmailThreadWhereInput = {
    status: "OPEN",
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

  const [threads, allMailboxes, staffUsers] = await Promise.all([
    prisma.emailThread.findMany({
      where: emailThreadWhere,
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        mailbox: { select: { id: true, label: true, address: true } },
        emails: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { bodyText: true, bodyHtml: true, sentAt: true, direction: true },
        },
      },
    }),
    prisma.emailAddress.findMany({
      where: { isActive: true },
      select: { id: true, label: true, address: true },
      orderBy: { createdAt: "desc" },
    }),
    /* Fetch staff/admin User emails so we can exclude personal mailboxes from the sidebar */
    prisma.user.findMany({
      where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
      select: { email: true },
    }),
  ]);

  /* Filter out personal staff email addresses — only show shared/company mailboxes */
  const staffEmailSet = new Set(staffUsers.map((u) => u.email?.toLowerCase()).filter(Boolean));
  const currentUserEmail = session?.user?.email?.toLowerCase();
  
  const sharedMailboxes = allMailboxes.filter((m) => {
    const addr = m.address.toLowerCase();
    if (addr === currentUserEmail) return true; // Always show current user's mailbox
    return !staffEmailSet.has(addr); // Filter out other staff personal mailboxes
  });

  /* Compute per-mailbox unread counts */
  const unreadByMailbox = await prisma.emailThread.groupBy({
    by: ["mailboxId"],
    where: { ...emailThreadWhere, hasUnread: true },
    _count: { id: true },
  });
  const unreadMap = new Map(unreadByMailbox.map((r) => [r.mailboxId, r._count.id]));

  const serializedThreads = threads.map((t) => {
    const latest = t.emails[0];
    const snippet = latest
      ? (latest.bodyText ?? (latest.bodyHtml ? stripHtml(latest.bodyHtml) : "")).slice(0, 220) || null
      : null;

    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      customerName: t.customerName,
      customerEmail: t.customerEmail,
      updatedAt: t.updatedAt.toISOString(),
      hasUnread: t.hasUnread,
      mailbox: t.mailbox,
      latestSnippet: snippet,
      latestEmailAt: latest?.sentAt?.toISOString() ?? null,
      latestDirection: latest?.direction ?? null,
    };
  });

  const mailboxesWithUnread = sharedMailboxes.map((m) => ({
    ...m,
    unreadCount: unreadMap.get(m.id) ?? 0,
  }));

  /* Pre-fetch first thread detail for initial Pane 3 render */
  const firstThread = threads[0] ?? null;
  let initialSelectedThread = null;
  let initialEmails: {
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    isRead: boolean;
    sentAt: string;
    bodyHtml: string;
    bodyText: string | null;
    subject: string;
    cc: string | null;
    toAddress: string;
    fromAddress: string;
    attachments: unknown;
  }[] = [];

  if (firstThread) {
    const fullThread = await prisma.emailThread.findUnique({
      where: { id: firstThread.id },
      include: {
        mailbox: { select: { id: true, address: true, label: true } },
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

    if (fullThread) {
      initialSelectedThread = {
        id: fullThread.id,
        subject: fullThread.subject,
        status: fullThread.status,
        hasUnread: fullThread.hasUnread,
        customerName: fullThread.customerName,
        customerEmail: fullThread.customerEmail,
        assignedToId: fullThread.assignedToId,
        mailbox: fullThread.mailbox,
      };

      initialEmails = fullThread.emails.map((e) => ({
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
      }));

      // Mark first thread as read
      await prisma.$transaction([
        prisma.email.updateMany({
          where: { threadId: firstThread.id, direction: "INBOUND", isRead: false },
          data: { isRead: true },
        }),
        prisma.emailThread.updateMany({
          where: { id: firstThread.id },
          data: { hasUnread: false },
        }),
      ]);
    }
  }

  return (
    <EmailInboxThreePane
      initialThreads={serializedThreads}
      mailboxes={mailboxesWithUnread}
      currentUserEmail={session?.user?.email ?? undefined}
      initialSelectedThread={initialSelectedThread}
      initialEmails={initialEmails}
    />
  );
}

