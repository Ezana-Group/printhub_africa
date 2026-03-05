import { requireAdminSettings } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

export default async function AdminSettingsSeoPage() {
  await requireAdminSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">SEO Settings</h1>
      <form id="settings-seo" className="space-y-6">
      <SectionCard
        title="Global SEO"
        description="Site name, tagline, default meta title and description."
      >
        <div className="grid gap-2">
          <Label>Site name</Label>
          <Input defaultValue="PrintHub" />
          <Label>Site tagline</Label>
          <Input defaultValue="Professional Large Format & 3D Printing — Nairobi, Kenya" />
          <Label>Default meta title template</Label>
          <Input defaultValue="{page_title} | PrintHub Kenya" />
          <Label>Default meta description (160 chars max)</Label>
          <Input placeholder="Meta description" maxLength={160} />
          <Label>Google site verification</Label>
          <Input placeholder="Paste meta tag content" />
          <Label>Canonical domain</Label>
          <Input defaultValue="https://printhub.africa" readOnly className="bg-muted" />
        </div>
      </SectionCard>
      <SectionCard
        title="Sitemap"
        description="Auto-generate sitemap. Include pages, products, blog, categories."
      >
        <div className="flex items-center gap-4">
          <Switch defaultChecked />
          <Label>Auto-generate sitemap</Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">URL: https://printhub.africa/sitemap.xml</p>
        <Button type="button" variant="outline" size="sm" className="mt-2">Regenerate Now</Button>
      </SectionCard>
      <SectionCard
        title="Robots.txt"
        description="Disallow /admin/, /api/, /account/. Allow /. Sitemap URL."
      >
        <textarea className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 font-mono text-sm" defaultValue={`User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Allow: /
Sitemap: https://printhub.africa/sitemap.xml`} />
        <div className="flex gap-2 mt-2">
          <Button type="button" variant="outline" size="sm">Save</Button>
          <Button type="button" variant="ghost" size="sm">Reset to Default</Button>
        </div>
      </SectionCard>
      <SectionCard
        title="Open Graph / Social"
        description="Default OG image 1200×630. Twitter card, handle."
      >
        <Label>Default OG image</Label>
        <Button type="button" variant="outline" size="sm">Upload 1200×630px</Button>
        <div className="grid gap-2 mt-4">
          <Label>Twitter card type</Label>
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>summary_large_image</option>
          </select>
          <Label>Twitter handle</Label>
          <Input defaultValue="@PrintHubKenya" />
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-seo" action="/api/admin/settings/seo" />
      </form>
    </div>
  );
}
