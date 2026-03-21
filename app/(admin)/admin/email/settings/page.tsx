export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { EmailMailboxSettingsClient } from "@/components/admin/email/email-mailbox-settings-client";

export default async function AdminEmailSettingsPage() {
  try {

  await requireAdminSection("/admin/email/settings");

  const mailboxes = await prisma.emailAddress.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      address: true,
      label: true,
      isActive: true,
      createdAt: true,
    },
  });

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  const mailboxIds = mailboxes.map((m) => m.id);
  const viewers = mailboxIds.length
    ? await prisma.emailMailboxViewer.findMany({
        where: { mailboxId: { in: mailboxIds } },
        select: { mailboxId: true, userId: true },
      })
    : [];

  const viewersByMailboxId: Record<string, string[]> = {};
  for (const v of viewers) {
    if (!viewersByMailboxId[v.mailboxId]) viewersByMailboxId[v.mailboxId] = [];
    viewersByMailboxId[v.mailboxId].push(v.userId);
  }

  return (
    <EmailMailboxSettingsClient
      mailboxes={mailboxes.map((m) => ({
        id: m.id,
        address: m.address,
        label: m.label,
        isActive: m.isActive,
        createdAt: m.createdAt.toISOString(),
      }))}
      staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email }))}
      viewersByMailboxId={viewersByMailboxId}
    />
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}

