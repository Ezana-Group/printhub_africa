import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsDiscountsPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Discount Settings</h1>
      <p className="text-sm text-muted-foreground">General rules. Individual coupons in Marketing → Coupons.</p>
      <form id="settings-discounts" className="space-y-6">
      <SectionCard
        title="Global Rules"
        description="Stacking and max discount."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Switch />
            <Label>Allow stacking coupons (only 1 per order if off)</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch />
            <Label>Coupon + sale stacking</Label>
          </div>
          <div className="grid gap-2">
            <Label>Max discount per order</Label>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="30" className="w-20" /> % or KES
              <Input type="number" defaultValue="5000" className="w-24" /> whichever is less
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Switch />
            <Label>Auto-apply best coupon (customer must enter code if off)</Label>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title="Sale Badge Settings"
        description="When to show Sale, Hot, New badges."
      >
        <div className="grid gap-2">
          <Label>Show &quot;Sale&quot; badge when discount ≥ (%)</Label>
          <Input type="number" defaultValue="10" className="w-24" />
          <Label>Show &quot;Hot&quot; badge for items with (orders this week)</Label>
          <Input type="number" defaultValue="10" className="w-24" />
          <Label>Show &quot;New&quot; badge for products added within (days)</Label>
          <Input type="number" defaultValue="30" className="w-24" />
        </div>
      </SectionCard>
      <SectionCard
        title="Volume Discount Defaults"
        description="Apply when no custom tiers per product. Apply to: Shop, Large format, 3D."
      >
        <div className="grid gap-2 text-sm">
          <div className="flex gap-2">2–4 units: <Input type="number" defaultValue="5" className="w-16" /> % off</div>
          <div className="flex gap-2">5–9 units: <Input type="number" defaultValue="10" className="w-16" /> % off</div>
          <div className="flex gap-2">10–19 units: <Input type="number" defaultValue="15" className="w-16" /> % off</div>
          <div className="flex gap-2">20–49 units: <Input type="number" defaultValue="20" className="w-16" /> % off</div>
          <div className="flex gap-2">50+ units: <Input type="number" defaultValue="25" className="w-16" /> % off</div>
        </div>
        <div className="flex gap-4 mt-4">
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /> Shop products</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /> Large format</label>
          <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /> 3D print</label>
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-discounts" action="/api/admin/settings/discounts" />
      </form>
    </div>
  );
}
