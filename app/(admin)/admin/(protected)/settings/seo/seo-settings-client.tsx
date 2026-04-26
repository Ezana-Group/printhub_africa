"use client";

import { useSettingsForm } from "@/hooks/useSettingsForm";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Globe, Search, MessageSquare, Twitter } from "lucide-react";
import { useState } from "react";

type SeoSettings = {
  seoSiteName?: string;
  seoTagline?: string;
  seoDefaultTitle?: string;
  seoDefaultDescription?: string;
  googleSiteVerification?: string;
  canonicalDomain?: string;
  twitterHandle?: string;
  twitterCardType?: string;
  defaultOgImage?: string;
  robotsTxt?: string;
  sitemapIncludePages?: boolean;
  sitemapIncludeProducts?: boolean;
  sitemapIncludeCategories?: boolean;
};

export function SeoSettingsClient() {
  const { data, patch, loading, saving, error, isDirty, save, discard } = useSettingsForm<SeoSettings>("/api/admin/settings/seo");
  const [sitemapMessage, setSitemapMessage] = useState<string | null>(null);

  const handleRegenerateSitemap = async () => {
    try {
      const res = await fetch("/api/admin/settings/seo/sitemap-regenerate", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setSitemapMessage(`✓ Sitemap regenerated at ${new Date().toLocaleTimeString()}`);
      else setSitemapMessage(json.error ?? "Failed");
    } catch {
      setSitemapMessage("Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading SEO configuration…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form id="settings-seo" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <SectionCard 
          title="Global Search Engine Optimization" 
          description="Control how your site appears in search results."
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Site Name</Label>
              <Input
                value={data?.seoSiteName ?? ""}
                onChange={(e) => patch({ seoSiteName: e.target.value })}
                placeholder="e.g. PrintHub Africa"
              />
            </div>
            <div className="grid gap-2">
              <Label>Site Tagline</Label>
              <Input
                value={data?.seoTagline ?? ""}
                onChange={(e) => patch({ seoTagline: e.target.value })}
                placeholder="e.g. Printing the Future, Made in Kenya"
              />
            </div>
            <div className="grid gap-2">
              <Label>Default Meta Title</Label>
              <Input
                value={data?.seoDefaultTitle ?? ""}
                onChange={(e) => patch({ seoDefaultTitle: e.target.value })}
                placeholder="Primary title for the homepage"
              />
              <p className="text-xs text-muted-foreground italic">Recommended: 50-60 characters.</p>
            </div>
            <div className="grid gap-2">
              <Label>Default Meta Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                maxLength={160}
                value={data?.seoDefaultDescription ?? ""}
                onChange={(e) => patch({ seoDefaultDescription: e.target.value })}
                placeholder="Summary of your business for search engines..."
              />
              <p className="text-xs text-muted-foreground italic">Max 160 characters.</p>
            </div>
            <div className="grid gap-2">
              <Label>Canonical Domain</Label>
              <Input 
                value={data?.canonicalDomain ?? "https://printhub.africa"} 
                onChange={(e) => patch({ canonicalDomain: e.target.value })}
                placeholder="https://yourdomain.com"
              />
              <p className="text-xs text-muted-foreground italic">Ensures all URLs point to a single authoritative domain.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title="Sitemap & Indexing" 
          description="Configure which sections of your site should be crawled by search engines."
        >
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={data?.sitemapIncludePages ?? true}
                  onCheckedChange={(v) => patch({ sitemapIncludePages: v })}
                />
                <Label>Include Static Pages</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={data?.sitemapIncludeProducts ?? true}
                  onCheckedChange={(v) => patch({ sitemapIncludeProducts: v })}
                />
                <Label>Include Products</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={data?.sitemapIncludeCategories ?? true}
                  onCheckedChange={(v) => patch({ sitemapIncludeCategories: v })}
                />
                <Label>Include Categories</Label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="block mb-2">Robots.txt Rules</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                value={data?.robotsTxt ?? ""}
                onChange={(e) => patch({ robotsTxt: e.target.value })}
                placeholder="User-agent: *&#10;Disallow: /admin/&#10;..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={handleRegenerateSitemap}>
                Regenerate Sitemap
              </Button>
              {sitemapMessage && <p className="text-sm text-green-600 font-medium">{sitemapMessage}</p>}
            </div>
          </div>
        </SectionCard>

        <SectionCard 
          title="Verification & Social" 
          description="External service verification and social sharing (Open Graph) defaults."
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Google Site Verification</Label>
              <Input
                placeholder="Paste code from Google Search Console"
                value={data?.googleSiteVerification ?? ""}
                onChange={(e) => patch({ googleSiteVerification: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Default OG Image URL</Label>
              <Input
                value={data?.defaultOgImage ?? ""}
                onChange={(e) => patch({ defaultOgImage: e.target.value })}
                placeholder="https://domain.com/default-og.png"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Twitter Handle</Label>
                <Input
                  value={data?.twitterHandle ?? ""}
                  onChange={(e) => patch({ twitterHandle: e.target.value })}
                  placeholder="@yourbusiness"
                />
              </div>
              <div className="grid gap-2">
                <Label>Twitter Card Type</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={data?.twitterCardType ?? "summary_large_image"}
                  onChange={(e) => patch({ twitterCardType: e.target.value })}
                >
                  <option value="summary_large_image">Summary Large Image</option>
                  <option value="summary">Summary</option>
                </select>
              </div>
            </div>
          </div>
        </SectionCard>
      </form>

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 backdrop-blur-md px-6 py-4 shadow-xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-amber-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Unsaved changes in SEO configuration
            </span>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={discard}>
                Discard
              </Button>
              <Button
                type="button"
                onClick={() => save()}
                disabled={saving}
                className="bg-[#CC3D00] hover:bg-[#E64500] text-white"
              >
                {saving ? "Saving…" : "Save SEO Settings"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive font-medium mt-2">{error}</p>}
    </div>
  );
}
