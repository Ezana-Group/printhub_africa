import { requireSuperAdmin } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { DangerZoneActions } from "@/components/admin/settings/danger-zone-actions";

export default async function AdminSettingsDangerPage() {
  await requireSuperAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-destructive">Danger Zone</h1>
      <p className="text-sm text-amber-600">
        Actions here are irreversible. Proceed with extreme caution. Confirmation is required for each action.
      </p>
      <div className="space-y-6">
        <DangerZoneActions />
      </div>
      <SectionCard
        title="Enable Developer Mode"
        description="Shows debug information in admin. Never enable on production for extended periods."
      >
        <Button type="button" variant="outline">Enable Developer Mode</Button>
      </SectionCard>
    </div>
  );
}
