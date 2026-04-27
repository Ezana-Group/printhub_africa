export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { EmailMailboxSettingsClient } from "@/components/admin/email/email-mailbox-settings-client";

export default async function AdminEmailSettingsPage() {
  try {

  await requireAdminSection("/admin/email/settings");

  const [mailboxes, staff, businessSettings] = await Promise.all([
    prisma.emailAddress.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, address: true, label: true, isActive: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "STAFF" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.businessSettings.findUnique({
      where: { id: "default" },
      select: {
        emailFrom: true,
        emailFromName: true,
        emailReplyTo: true,
        adminAlertEmail: true,
        resendApiKey: true,
      },
    }).catch(() => null),
  ]);

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

  // Setup status — check env vars server-side, pass booleans only (no secret values)
  const setupStatus = {
    resendApiKey: !!(businessSettings?.resendApiKey || process.env.RESEND_API_KEY),
    resendWebhookSecret: !!process.env.RESEND_WEBHOOK_SECRET,
    cloudflareConfigured:
      !!process.env.CLOUDFLARE_API_TOKEN &&
      !!process.env.CLOUDFLARE_ZONE_ID &&
      !!process.env.RESEND_INBOUND_ADDRESS,
    fromEmail: businessSettings?.emailFrom || process.env.FROM_EMAIL || null,
    fromName: businessSettings?.emailFromName || null,
    replyTo: businessSettings?.emailReplyTo || null,
    adminAlertEmail: businessSettings?.adminAlertEmail || null,
  };

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
      setupStatus={setupStatus}
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
