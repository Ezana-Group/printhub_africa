import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsSystemPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">System</h1>
      <form id="settings-system" className="space-y-6">
      <SectionCard
        title="Maintenance Mode"
        description="When enabled, public site shows maintenance page; admin panel remains accessible."
      >
        <p className="text-sm text-green-600 font-medium mb-2">Status: Site is Live</p>
        <Button type="button" variant="outline">Enable Maintenance Mode</Button>
        <div className="mt-4">
          <Label>Maintenance message (shown to visitors)</Label>
          <textarea className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="PrintHub is undergoing scheduled maintenance..." />
        </div>
      </SectionCard>
      <SectionCard
        title="Site Configuration"
        description="Site URL, admin prefix, time zone, currency."
      >
        <div className="grid gap-2">
          <Label>Site URL</Label>
          <Input defaultValue="https://printhub.africa" readOnly className="bg-muted" />
          <Label>Admin URL prefix</Label>
          <Input defaultValue="/admin" readOnly className="bg-muted" />
          <Label>Time zone</Label>
          <Input defaultValue="Africa/Nairobi (EAT, UTC+3)" readOnly className="bg-muted" />
          <Label>Currency</Label>
          <Input defaultValue="KES" readOnly className="bg-muted" />
          <Label>Minimum order value (KES)</Label>
          <Input type="number" defaultValue="500" />
        </div>
      </SectionCard>
      <SectionCard
        title="Cache Management"
        description="Pricing, product, finance cache TTL. Clear caches."
      >
        <div className="grid gap-2">
          <Label>Pricing cache TTL (seconds)</Label>
          <Input type="number" defaultValue="300" />
          <Label>Product cache TTL (seconds)</Label>
          <Input type="number" defaultValue="600" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline" size="sm">Clear All Caches Now</Button>
          <Button type="button" variant="outline" size="sm">Clear Pricing Cache Only</Button>
        </div>
      </SectionCard>
      <SectionCard
        title="Database"
        description="Manual backup, last automatic backup, retention, storage."
      >
        <Button type="button" variant="outline" size="sm">Run Database Backup Now</Button>
        <p className="text-sm text-muted-foreground mt-2">Retention: 7 days. Storage: S3 (encrypted).</p>
      </SectionCard>
      <SectionCard
        title="Logs"
        description="Error logs 30 days, audit log 365 days."
      >
        <Button type="button" variant="outline" size="sm">Download Error Log (last 7 days)</Button>
        <Button type="button" variant="outline" size="sm" className="ml-2">Download Audit Log</Button>
      </SectionCard>
      <SectionCard
        title="Feature Flags"
        description="Toggle experimental or optional features."
      >
        <div className="space-y-2">
          {["Loyalty Points", "Referral Programme", "Corporate Accounts", "3D File Auto-Analysis", "Instagram Feed", "Blog / News", "Product Reviews"].map((name) => (
            <div key={name} className="flex items-center justify-between">
              <Label>{name}</Label>
              <Switch defaultChecked={name !== "Referral Programme"} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-system" action="/api/admin/settings/system" />
      </form>
    </div>
  );
}
