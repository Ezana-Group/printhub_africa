export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { NotificationsSettingsForm } from "@/components/admin/settings/notifications-settings-form";

export default async function AdminSettingsNotificationsPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Notifications & Communications</h1>
      <NotificationsSettingsForm />
    </div>
  );
}
