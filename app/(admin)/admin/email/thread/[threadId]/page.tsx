import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { authOptions } from "@/lib/auth";
import { EmailThreadClient } from "@/components/admin/email/email-thread-client";

const STATUS_SET = new Set(["OPEN", "CLOSED", "SPAM"]);
type ThreadStatus = "OPEN" | "CLOSED" | "SPAM";

export default async function AdminEmailThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{
    status?: string;
    mailboxId?: string;
    assignedToId?: string;
  }>;
}) {
  await requireAdminSection("/admin/email/thread");

  const { threadId } = await params;
  const qp = await searchParams;

  const statusRaw = qp.status?.trim().toUpperCase() ?? "";
  const status: ThreadStatus = STATUS_SET.has(statusRaw) ? (statusRaw as ThreadStatus) : "OPEN";
  const mailboxId = qp.mailboxId?.trim() ? qp.mailboxId.trim() : undefined;
  const assignedToId = qp.assignedToId?.trim() ? qp.assignedToId.trim() : undefined;

  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();
  const currentUser = session.user as { id?: string; role?: string; permissions?: string[] };

  // Mark the selected thread as read on load (inbound messages only).
  await prisma.$transaction([
    prisma.email.updateMany({
      where: { threadId, direction: "INBOUND", isRead: false },
      data: { isRead: true },
    }),
    prisma.emailThread.updateMany({
      where: { id: threadId },
      data: { hasUnread: false },
    }),
  ]);

  const thread = await prisma.emailThread.findUnique({
    where: { id: threadId },
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

  if (!thread) notFound();

  const sidebarThreads = await prisma.emailThread.findMany({
    where: {
      isActive: true,
      status,
      ...(mailboxId ? { mailboxId } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      id: true,
      subject: true,
      status: true,
      hasUnread: true,
      customerName: true,
      customerEmail: true,
      updatedAt: true,
      mailbox: { select: { id: true, label: true, address: true } },
    },
  });

  const [mailboxes, assignees] = await Promise.all([
    prisma.emailAddress.findMany({
      where: { isActive: true },
      select: { id: true, label: true, address: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  const serializedThread = {
    id: thread.id,
    subject: thread.subject,
    status: thread.status,
    hasUnread: thread.hasUnread,
    customerName: thread.customerName,
    customerEmail: thread.customerEmail,
    assignedToId: thread.assignedToId,
    mailbox: thread.mailbox,
  };

  const serializedEmails = thread.emails.map((e) => ({
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

  return (
    <EmailThreadClient
      thread={serializedThread}
      emails={serializedEmails}
      currentUser={currentUser}
      sidebarThreads={sidebarThreads.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        hasUnread: t.hasUnread,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        updatedAt: t.updatedAt.toISOString(),
        mailbox: t.mailbox,
      }))}
      mailboxes={mailboxes.map((m) => ({ id: m.id, label: m.label, address: m.address }))}
      assignees={assignees.map((a) => ({ id: a.id, name: a.name, email: a.email }))}
      initialFilters={{ status, mailboxId, assignedToId }}
    />
  );
}

