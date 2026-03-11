"use client";

import { useSettingsForm } from "@/hooks/useSettingsForm";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type SeoSettings = {
  id?: string;
  siteName?: string;
  siteTagline?: string;
  metaTitleTemplate?: string;
  defaultMetaDescription?: string;
  googleVerification?: string;
  bingVerification?: string;
  canonicalDomain?: string;
  twitterHandle?: string;
  twitterCardType?: string;
  defaultOgImageUrl?: string;
  robotsTxt?: string;
  sitemapIncludePages?: boolean;
  sitemapIncludeProducts?: boolean;
  sitemapIncludeBlog?: boolean;
  sitemapIncludeCategories?: boolean;
};

export function SeoSettingsClient() {
  const { data, patch, loading, saving, error, isDirty, save, discard } = useSettingsForm<SeoSettings>("/api/admin/settings/seo");
  const [sitemapMessage, setSitemapMessage] = useState<string | null>(null);

  const handleRegenerateSitemap = async () => {
    try {
      const res = await fetch("/api/admin/settings/seo/sitemap/generate", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setSitemapMessage(`✓ Sitemap regenerated at ${new Date().toLocaleTimeString()}`);
      else setSitemapMessage(json.error ?? "Failed");
    } catch {
      setSitemapMessage("Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form id="settings-seo" className="space-y-6">
        <SectionCard title="Global SEO" description="Site name, tagline, default meta title and description.">
          <div className="grid gap-2">
            <Label>Site name</Label>
            <Input
              value={data?.siteName ?? ""}
              onChange={(e) => patch({ siteName: e.target.value })}
            />
            <Label>Site tagline</Label>
            <Input
              value={data?.siteTagline ?? ""}
              onChange={(e) => patch({ siteTagline: e.target.value })}
            />
            <Label>Default meta title template</Label>
            <Input
              value={data?.metaTitleTemplate ?? ""}
              onChange={(e) => patch({ metaTitleTemplate: e.target.value })}
            />
            <Label>Default meta description (160 chars max)</Label>
            <Input
              placeholder="Meta description"
              maxLength={160}
              value={data?.defaultMetaDescription ?? ""}
              onChange={(e) => patch({ defaultMetaDescription: e.target.value })}
            />
            <Label>Google site verification</Label>
            <Input
              placeholder="Paste meta tag content"
              value={data?.googleVerification ?? ""}
              onChange={(e) => patch({ googleVerification: e.target.value })}
            />
            <Label>Canonical domain</Label>
            <Input value={data?.canonicalDomain ?? "https://printhub.africa"} readOnly className="bg-muted" />
          </div>
        </SectionCard>
        <SectionCard title="Sitemap" description="Include pages, products, categories. Regenerate on demand.">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={data?.sitemapIncludePages ?? true}
                onCheckedChange={(v) => patch({ sitemapIncludePages: v })}
              />
              <Label>Pages</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={data?.sitemapIncludeProducts ?? true}
                onCheckedChange={(v) => patch({ sitemapIncludeProducts: v })}
              />
              <Label>Products</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={data?.sitemapIncludeCategories ?? true}
                onCheckedChange={(v) => patch({ sitemapIncludeCategories: v })}
              />
              <Label>Categories</Label>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">URL: https://printhub.africa/sitemap.xml</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleRegenerateSitemap}>
            Regenerate Now
          </Button>
          {sitemapMessage && <p className="mt-2 text-sm text-green-600">{sitemapMessage}</p>}
        </SectionCard>
        <SectionCard title="Robots.txt" description="Disallow /admin/, /api/, /account/. Allow /. Sitemap URL.">
          <textarea
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            value={data?.robotsTxt ?? ""}
            onChange={(e) => patch({ robotsTxt: e.target.value })}
            placeholder="User-agent: *&#10;Disallow: /admin/&#10;..."
          />
        </SectionCard>
        <SectionCard title="Open Graph / Social" description="Default OG image 1200×630. Twitter card, handle.">
          <Label>Twitter card type</Label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={data?.twitterCardType ?? "summary_large_image"}
            onChange={(e) => patch({ twitterCardType: e.target.value })}
          >
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </select>
          <Label className="mt-4 block">Twitter handle</Label>
          <Input
            value={data?.twitterHandle ?? ""}
            onChange={(e) => patch({ twitterHandle: e.target.value })}
          />
        </SectionCard>
      </form>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
            <div className="flex gap-3">
              <button type="button" onClick={discard} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                Discard
              </button>
              <button
                type="button"
                onClick={() => save().then(() => {}).catch(() => {})}
                disabled={saving}
                className="rounded-md bg-[#FF4D00] px-4 py-1.5 text-sm text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
