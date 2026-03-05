import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsIntegrationsPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Integrations</h1>
      <form id="settings-integrations" className="space-y-6">
      <SectionCard
        title="API Keys & Webhooks"
        description="API keys for external access. Webhook URL for third-party service callbacks."
      >
        <div className="grid gap-2">
          <Label>API Key (masked)</Label>
          <Input readOnly className="bg-muted font-mono" value="ph_live_••••••••••••••••" />
          <Label>Webhook URL</Label>
          <Input readOnly className="bg-muted font-mono" value="https://printhub.africa/api/webhooks" />
          <p className="text-xs text-muted-foreground">Regenerate key from Security & Access. Webhook secret is set per integration.</p>
        </div>
      </SectionCard>
      <SectionCard
        title="Analytics"
        description="Google Analytics 4, Search Console, Hotjar."
      >
        <div className="grid gap-2">
          <Label>Google Analytics 4 — Measurement ID</Label>
          <Input placeholder="G-XXXXXXXXXX" />
          <Label>Hotjar Site ID</Label>
          <Input placeholder="Record admin sessions: keep disabled" />
        </div>
      </SectionCard>
      <SectionCard
        title="Search"
        description="Algolia — Application ID, Search API Key, Admin API Key, Index name."
      >
        <p className="text-sm text-muted-foreground">Status: Not configured</p>
        <Button type="button" variant="outline" size="sm">Re-index all products</Button>
      </SectionCard>
      <SectionCard
        title="Error Tracking"
        description="Sentry DSN and environment."
      >
        <Input type="password" placeholder="DSN" className="max-w-md" />
      </SectionCard>
      <SectionCard
        title="Storage (S3 / R2)"
        description="Bucket names, region, access key, secret key, CDN URL."
      >
        <div className="grid gap-2">
          <Label>Bucket (uploads) / Bucket (public)</Label>
          <Input placeholder="printhub-uploads" />
          <Label>Region / Access Key / Secret Key</Label>
          <Input type="password" placeholder="••••••••" />
          <Label>CDN URL</Label>
          <Input placeholder="https://cdn.printhub.africa" />
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2">Test Connection</Button>
      </SectionCard>
      <SectionCard
        title="Accounting (optional)"
        description="Xero, QuickBooks — OAuth connect."
      >
        <Button type="button" variant="outline">Connect Xero</Button>
        <Button type="button" variant="outline" className="ml-2">Connect QuickBooks</Button>
      </SectionCard>
      <SectionCard title="Google Business" description="Verify listing.">
        <Button type="button" variant="outline">Connect / Verify</Button>
      </SectionCard>
      <SettingsSaveButton formId="settings-integrations" action="/api/admin/settings/integrations" />
      </form>
    </div>
  );
}
