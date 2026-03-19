import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { EmailMailboxSettingsClient } from "@/components/admin/email/email-mailbox-settings-client";

export default async function AdminEmailSettingsPage() {
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

  return (
    <EmailMailboxSettingsClient
      mailboxes={mailboxes.map((m) => ({
        id: m.id,
        address: m.address,
        label: m.label,
        isActive: m.isActive,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}

