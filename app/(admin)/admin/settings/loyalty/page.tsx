import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsLoyaltyPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Loyalty Programme</h1>
      <form id="settings-loyalty" className="space-y-6">
      <SectionCard
        title="Programme Status"
        description="Enable and name the programme."
      >
        <div className="flex items-center gap-4">
          <Switch defaultChecked />
          <Label>Enable loyalty programme</Label>
        </div>
        <div className="grid gap-2 mt-4">
          <Label>Programme name</Label>
          <Input defaultValue="PrintHub Points" />
          <Label>Points currency name</Label>
          <Input defaultValue="Points" />
        </div>
      </SectionCard>
      <SectionCard
        title="Earning Rules"
        description="Points per KES spent. Bonus events: first order, birthday month, review, referral, corporate."
      >
        <div className="grid gap-2">
          <Label>Points per KES spent</Label>
          <div className="flex items-center gap-2">
            <Input type="number" defaultValue="1" className="w-20" /> point per KES
            <Input type="number" defaultValue="100" className="w-24" /> spent
          </div>
          <Label>Round points</Label>
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-40">
            <option>Down (1.7 → 1)</option>
          </select>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Bonus: First order +50, Birthday month 2×, Review +20, Referral referee +100 referrer +50, Corporate 1.5×</p>
      </SectionCard>
      <SectionCard
        title="Redemption Rules"
        description="Points value, minimum to redeem, max discount %, expiry."
      >
        <div className="grid gap-2">
          <Label>Points value</Label>
          <div className="flex items-center gap-2">
            <Input type="number" defaultValue="1" className="w-20" /> point = KES
            <Input type="number" defaultValue="0.50" className="w-24" />
          </div>
          <Label>Minimum to redeem (points)</Label>
          <Input type="number" defaultValue="200" />
          <Label>Maximum discount per order (%)</Label>
          <Input type="number" defaultValue="20" />
          <Label>Expiry (months of inactivity)</Label>
          <Input type="number" defaultValue="24" />
        </div>
      </SectionCard>
      <SectionCard
        title="Tiers (optional)"
        description="Bronze, Silver, Gold, Platinum with earn rate and benefits."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Enable tiers</Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Bronze 0–999, Silver 1k–4.9k (1.25×), Gold 5k–19.9k (1.5× + free delivery), Platinum 20k+ (2× + express + priority)</p>
      </SectionCard>
      <SettingsSaveButton formId="settings-loyalty" action="/api/admin/settings/loyalty" />
      </form>
    </div>
  );
}
