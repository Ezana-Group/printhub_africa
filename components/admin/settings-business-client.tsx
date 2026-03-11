"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EditableSection } from "@/components/admin/editable-section";

const EMPTY: Record<string, string> = {};
const getStr = (obj: Record<string, string>, key: string) => obj[key] ?? "";

export function SettingsBusinessClient({
  initialData,
  canEdit = true,
}: {
  initialData?: Record<string, string>;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string>>(initialData ?? EMPTY);
  const [loading, setLoading] = useState(!initialData || Object.keys(initialData).length === 0);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/settings/business");
      const json = await r.json().catch(() => ({}));
      if (r.ok && typeof json === "object" && json !== null) {
        const normalized: Record<string, string> = {};
        for (const [k, v] of Object.entries(json)) {
          normalized[k] = typeof v === "string" ? v : String(v ?? "");
        }
        setData(normalized);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading && (!initialData || Object.keys(initialData).length === 0)) {
      fetchSettings();
    }
  }, [loading, initialData, fetchSettings]);

  const update = useCallback((key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveFull = useCallback(async () => {
    const res = await fetch("/api/admin/settings/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error ?? "Failed to save");
    router.refresh();
  }, [data, router]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading business settings…</p>;
  }

  return (
    <div className="space-y-6">
      <EditableSection
        id="business-identity"
        title="Identity"
        description="Appears on invoices, quotes, emails, and the website."
        canEdit={canEdit}
        viewContent={
          <div className="space-y-0">
            {[
              { label: "Business name", value: getStr(data, "businessName") || "PrintHub" },
              { label: "Trading name", value: getStr(data, "tradingName") || "PrintHub (An Ezana Group Company)" },
              { label: "Tagline", value: getStr(data, "tagline") || "Professional Printing. Nairobi. Kenya." },
              { label: "Website", value: getStr(data, "website") || "printhub.africa" },
              { label: "Favicon", value: getStr(data, "favicon") || "—" },
            ].map((row, i) => (
              <div
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded px-1 -mx-1"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        }
        editContent={({ setHasChanges }) => (
          <div className="space-y-4" onChange={() => setHasChanges(true)} onInput={() => setHasChanges(true)}>
            <div className="space-y-1.5">
              <Label>Business Name *</Label>
              <Input
                value={getStr(data, "businessName")}
                onChange={(e) => update("businessName", e.target.value)}
                className="focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Trading Name</Label>
              <Input
                value={getStr(data, "tradingName")}
                onChange={(e) => update("tradingName", e.target.value)}
                className="focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input
                value={getStr(data, "tagline")}
                onChange={(e) => update("tagline", e.target.value)}
                className="focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input
                value={getStr(data, "website")}
                onChange={(e) => update("website", e.target.value)}
                readOnly
                className="bg-muted focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Favicon</Label>
              <Input
                value={getStr(data, "favicon")}
                onChange={(e) => update("favicon", e.target.value)}
                placeholder="32×32px ICO or PNG"
                className="focus-visible:ring-orange-500"
              />
            </div>
            <p className="text-sm text-muted-foreground">Logo: Min 400×400px, PNG. <Button type="button" variant="outline" size="sm" disabled title="Coming soon">Upload</Button></p>
          </div>
        )}
        onSave={saveFull}
      />

      <EditableSection
        id="business-contact"
        title="Contact & Location"
        description="Primary contact and physical address."
        canEdit={canEdit}
        viewContent={
          <div className="space-y-0">
            {[
              { label: "Primary Phone", value: getStr(data, "primaryPhone") },
              { label: "WhatsApp Business", value: getStr(data, "whatsapp") },
              { label: "Primary Email", value: getStr(data, "primaryEmail") || "hello@printhub.africa" },
              { label: "Support Email", value: getStr(data, "supportEmail") },
              { label: "Finance/Invoices Email", value: getStr(data, "financeEmail") },
              { label: "Address Line 1", value: getStr(data, "address1") },
              { label: "Address Line 2", value: getStr(data, "address2") },
              { label: "Town/City", value: getStr(data, "city") || "Nairobi" },
              { label: "County", value: getStr(data, "county") || "Nairobi County" },
              { label: "Country", value: getStr(data, "country") || "Kenya" },
              { label: "Google Maps URL", value: getStr(data, "googleMapsUrl") },
            ].map((row, i) => (
              <div
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded px-1 -mx-1"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-sm font-medium text-foreground">{row.value || "—"}</span>
              </div>
            ))}
          </div>
        }
        editContent={({ setHasChanges }) => (
          <div className="space-y-4" onChange={() => setHasChanges(true)} onInput={() => setHasChanges(true)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Primary Phone *</Label>
                <Input value={getStr(data, "primaryPhone")} onChange={(e) => update("primaryPhone", e.target.value)} placeholder="+254 XXX XXX XXX" className="focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp Business *</Label>
                <Input value={getStr(data, "whatsapp")} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+254 XXX XXX XXX" className="focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <Label>Primary Email *</Label>
                <Input value={getStr(data, "primaryEmail")} onChange={(e) => update("primaryEmail", e.target.value)} className="focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <Label>Support Email</Label>
                <Input value={getStr(data, "supportEmail")} onChange={(e) => update("supportEmail", e.target.value)} placeholder="support@printhub.africa" className="focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Finance/Invoices Email</Label>
                <Input value={getStr(data, "financeEmail")} onChange={(e) => update("financeEmail", e.target.value)} placeholder="finance@printhub.africa" className="focus-visible:ring-orange-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Physical Address Line 1</Label>
              <Input value={getStr(data, "address1")} onChange={(e) => update("address1", e.target.value)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="space-y-1.5">
              <Label>Physical Address Line 2</Label>
              <Input value={getStr(data, "address2")} onChange={(e) => update("address2", e.target.value)} className="focus-visible:ring-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Town/City</Label>
                <Input value={getStr(data, "city")} onChange={(e) => update("city", e.target.value)} className="focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <Label>County</Label>
                <Input value={getStr(data, "county")} onChange={(e) => update("county", e.target.value)} className="focus-visible:ring-orange-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={getStr(data, "country")} onChange={(e) => update("country", e.target.value)} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label>Google Maps URL</Label>
              <Input value={getStr(data, "googleMapsUrl")} onChange={(e) => update("googleMapsUrl", e.target.value)} placeholder="Paste link for contact page" className="focus-visible:ring-orange-500" />
            </div>
          </div>
        )}
        onSave={saveFull}
      />

      <EditableSection
        id="business-social"
        title="Social Media"
        description="Links for website and Instagram feed."
        canEdit={canEdit}
        viewContent={
          <div className="space-y-0">
            {["Facebook", "Instagram", "Twitter/X", "LinkedIn", "TikTok", "YouTube"].map((label, i) => {
              const key = ["socialFacebook", "socialInstagram", "socialTwitter", "socialLinkedIn", "socialTikTok", "socialYouTube"][i];
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 rounded px-1 -mx-1"
                >
                  <span className="text-sm text-muted-foreground">{label} URL</span>
                  <span className="text-sm font-medium text-foreground">{getStr(data, key) || "—"}</span>
                </div>
              );
            })}
          </div>
        }
        editContent={({ setHasChanges }) => (
          <div className="space-y-4" onChange={() => setHasChanges(true)} onInput={() => setHasChanges(true)}>
            {[
              { label: "Facebook", name: "socialFacebook" },
              { label: "Instagram", name: "socialInstagram" },
              { label: "Twitter/X", name: "socialTwitter" },
              { label: "LinkedIn", name: "socialLinkedIn" },
              { label: "TikTok", name: "socialTikTok" },
              { label: "YouTube", name: "socialYouTube" },
            ].map(({ label, name }) => (
              <div key={name} className="space-y-1.5">
                <Label>{label} URL</Label>
                <Input
                  value={getStr(data, name)}
                  onChange={(e) => update(name, e.target.value)}
                  placeholder="https://..."
                  className="focus-visible:ring-orange-500"
                />
              </div>
            ))}
          </div>
        )}
        onSave={saveFull}
      />
    </div>
  );
}
