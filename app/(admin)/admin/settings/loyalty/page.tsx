import { requireAdminSettings } from "@/lib/auth-guard";
import { LoyaltySettingsForm } from "@/components/admin/settings/loyalty-settings-form";

export default async function AdminSettingsLoyaltyPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Loyalty Programme</h1>
      <LoyaltySettingsForm />
    </div>
  );
}
