import { requireAdminSettings } from "@/lib/auth-guard";
import { ReferralSettingsForm } from "@/components/admin/settings/referral-settings-form";

export default async function AdminSettingsReferralPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Referral Programme</h1>
      <ReferralSettingsForm />
    </div>
  );
}
