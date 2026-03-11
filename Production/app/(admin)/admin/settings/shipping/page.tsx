import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { CouriersSection } from "@/components/admin/couriers-section";

export default async function AdminSettingsShippingPage() {
  await requireAdminSettings();
  let settings: { freeShippingEnabled: boolean; expressEnabled: boolean; clickCollectEnabled: boolean; freeShippingThreshold?: string } = {
    freeShippingEnabled: false,
    expressEnabled: false,
    clickCollectEnabled: false,
  };
  try {
    const row = await prisma.pricingConfig.findUnique({
      where: { key: "adminSettings:shipping" },
    });
    if (row?.valueJson) {
      const parsed = JSON.parse(row.valueJson) as Record<string, unknown>;
      const asBool = (v: unknown) => v === true || v === "true";
      const threshold = parsed.freeShippingThreshold;
      settings = {
        freeShippingEnabled: asBool(parsed.freeShippingEnabled) ?? false,
        expressEnabled: asBool(parsed.expressEnabled) ?? false,
        clickCollectEnabled: asBool(parsed.clickCollectEnabled) ?? false,
        freeShippingThreshold: threshold != null ? String(threshold) : undefined,
      };
    }
  } catch {
    // keep defaults
  }
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
        <SettingsSwitch name="freeShippingEnabled" defaultValue={settings.freeShippingEnabled} label="Enable free shipping" />
        <div className="grid gap-2 mt-4">
          <Label>Free shipping threshold (KES)</Label>
          <Input name="freeShippingThreshold" type="number" defaultValue={settings.freeShippingThreshold ?? "5000"} />
        </div>
      </SectionCard>
      <SectionCard
        title="Express Delivery"
        description="Surcharge and available zones."
      >
        <SettingsSwitch name="expressEnabled" defaultValue={settings.expressEnabled} label="Enable express option" />
        <p className="text-sm text-muted-foreground mt-2">Express surcharge: +30% on standard fee. Available zones: multi-select.</p>
      </SectionCard>
      <SectionCard
        title="Click & Collect"
        description="Collection address and hours."
      >
        <SettingsSwitch name="clickCollectEnabled" defaultValue={settings.clickCollectEnabled} label="Enable collection option" />
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
        description="Couriers used for order delivery. Tracking URL can use {trackingNumber} as placeholder. Shown to customers on the track page."
      >
        <CouriersSection />
      </SectionCard>
      <SettingsSaveButton formId="settings-shipping" action="/api/admin/settings/shipping" />
      </form>
    </div>
  );
}
