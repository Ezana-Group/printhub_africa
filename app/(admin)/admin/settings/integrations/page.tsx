import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";

export default async function AdminSettingsIntegrationsPage() {
  await requireAdminSettings();
  let integrations: Record<string, unknown> = {};
  try {
    const row = await prisma.pricingConfig.findUnique({ where: { key: "adminSettings:integrations" } });
    if (row?.valueJson) integrations = (JSON.parse(row.valueJson) as Record<string, unknown>) ?? {};
  } catch {
    // use defaults
  }
  const algoliaSearchEnabled =
    integrations.algoliaSearchEnabled === true || integrations.algoliaSearchEnabled === "true";
  const algoliaConfigured = Boolean(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID &&
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY &&
      (process.env.ALGOLIA_INDEX_NAME ?? process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME)
  );

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
        title="Search (Algolia)"
        description="Use Algolia for shop product search. Set NEXT_PUBLIC_ALGOLIA_APP_ID, NEXT_PUBLIC_ALGOLIA_SEARCH_KEY, and ALGOLIA_INDEX_NAME in env. Re-index products when you add or change them."
      >
        <p className="text-sm text-muted-foreground mb-2">
          Status: {algoliaConfigured ? "Configured" : "Not configured (set env vars)"} — {algoliaSearchEnabled ? "On" : "Off"}
        </p>
        <SettingsSwitch
          name="algoliaSearchEnabled"
          defaultValue={algoliaSearchEnabled}
          label="Use Algolia for shop search"
        />
        <Button type="button" variant="outline" size="sm" className="mt-2">Re-index all products</Button>
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
