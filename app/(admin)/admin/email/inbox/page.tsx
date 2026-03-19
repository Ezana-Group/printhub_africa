import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { EmailInboxClient } from "@/components/admin/email/email-inbox-client";
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

export default async function AdminEmailInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
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

  const { page, limit } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? "1"));
  const limitNum = Math.max(1, Math.min(100, Number(limit ?? "20")));
  const skip = (pageNum - 1) * limitNum;

  const emailThreadWhere: Prisma.EmailThreadWhereInput = {
    ...(isFullAccess ? {} : { status: "OPEN" }),
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

  const [threads, mailboxes] = await Promise.all([
    prisma.emailThread.findMany({
      where: emailThreadWhere,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limitNum,
      include: {
        mailbox: { select: { id: true, label: true, address: true } },
        emails: {
          orderBy: { sentAt: "desc" },
          take: 1,
          select: { bodyText: true, bodyHtml: true },
        },
      },
    }),
    prisma.emailAddress.findMany({
      where: { isActive: true },
      select: { id: true, label: true, address: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
    };
  });

  return (
    <EmailInboxClient
      threads={serializedThreads}
      mailboxes={mailboxes}
      currentUserEmail={session?.user?.email ?? undefined}
    />
  );
}

