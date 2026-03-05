import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsShippingPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Shipping & Delivery</h1>
      <form id="settings-shipping" className="space-y-6">
      <SectionCard
        title="Delivery Zones"
        description="Set delivery fees per county. Customers see these at checkout."
      >
        <p className="text-sm text-muted-foreground mb-4">
          Zone Name | Counties | Fee (KES) | Days | Active. All 47 counties must be assigned.
        </p>
        <Button type="button" variant="outline">+ Add Zone</Button>
        <p className="text-sm text-amber-600 mt-2">Unassigned counties warning if any county has no zone.</p>
      </SectionCard>
      <SectionCard
        title="Free Shipping"
        description="Orders above threshold get free delivery."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Enable free shipping</Label>
        </div>
        <div className="grid gap-2 mt-4">
          <Label>Free shipping threshold (KES)</Label>
          <Input name="freeShippingThreshold" type="number" defaultValue="5000" />
        </div>
      </SectionCard>
      <SectionCard
        title="Express Delivery"
        description="Surcharge and available zones."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Enable express option</Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Express surcharge: +30% on standard fee. Available zones: multi-select.</p>
      </SectionCard>
      <SectionCard
        title="Click & Collect"
        description="Collection address and hours."
      >
        <div className="flex items-center gap-4">
          <Switch />
          <Label>Enable collection option</Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Collection window: 7 days. Customer notified by SMS + email when ready.</p>
      </SectionCard>
      <SectionCard
        title="Large Item Policy"
        description="Oversized and fragile surcharges."
      >
        <p className="text-sm text-muted-foreground">Oversized: area over 2.0 sqm or weight over 5 kg. Surcharge KES 500. Fragile: KES 300.</p>
      </SectionCard>
      <SectionCard
        title="Courier Partners"
        description="Primary and secondary courier, tracking URL."
      >
        <div className="grid gap-2">
          <Label>Primary courier</Label>
          <Input placeholder="e.g. G4S, Wells Fargo" />
          <Label>Tracking URL (use &#123;trackingNumber&#125; as placeholder)</Label>
          <Input placeholder="https://courier.co.ke/track/{trackingNumber}" />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2">Test Tracking Link</Button>
      </SectionCard>
      <SettingsSaveButton formId="settings-shipping" action="/api/admin/settings/shipping" />
      </form>
    </div>
  );
}
