"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2 } from "lucide-react";

const API = "/api/admin/settings/system";
const FEATURE_FLAGS = [
  "Loyalty Points",
  "Referral Programme",
  "Corporate Accounts",
  "3D File Auto-Analysis",
  "Instagram Feed",
  "Blog / News",
  "Product Reviews",
];

type SystemData = Record<string, string | boolean>;

function flagKey(name: string) {
  return "featureFlag_" + name.replace(/\s+/g, "_");
}

export function SystemSettingsForm() {
  const router = useRouter();
  const [data, setData] = useState<SystemData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => setData(typeof d === "object" && d !== null ? d : {}))
      .catch(() => setData({}));
  }, []);

  const handleSave = async () => {
    const form = document.getElementById("settings-system") as HTMLFormElement | null;
    if (!form || data === null) return;
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData(form);
      const body: Record<string, unknown> = { ...data };
      for (const [k, v] of formData.entries()) {
        body[k] = v;
      }
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (data === null) {
    return <p className="text-sm text-muted-foreground py-4">Loading…</p>;
  }

  const val = (k: string, def: string) => (data[k] != null ? String(data[k]) : def);
  const flagChecked = (name: string) => data[flagKey(name)] === true || data[flagKey(name)] === "true";

  return (
    <form id="settings-system" className="space-y-6">
      <SectionCard
        title="Maintenance Mode"
        description="When enabled, public site shows maintenance page; admin panel remains accessible."
      >
        <p className="text-sm text-green-600 font-medium mb-2">Status: Site is Live</p>
        <Button type="button" variant="outline">Enable Maintenance Mode</Button>
        <div className="mt-4">
          <Label>Maintenance message (shown to visitors)</Label>
          <textarea
            name="maintenanceMessage"
            className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="PrintHub is undergoing scheduled maintenance..."
            defaultValue={val("maintenanceMessage", "")}
          />
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
          <Input name="minOrderKes" type="number" defaultValue={val("minOrderKes", "500")} />
        </div>
      </SectionCard>
      <SectionCard
        title="Cache Management"
        description="Pricing, product, finance cache TTL. Clear caches."
      >
        <div className="grid gap-2">
          <Label>Pricing cache TTL (seconds)</Label>
          <Input name="pricingCacheTtl" type="number" defaultValue={val("pricingCacheTtl", "300")} />
          <Label>Product cache TTL (seconds)</Label>
          <Input name="productCacheTtl" type="number" defaultValue={val("productCacheTtl", "600")} />
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline" size="sm">Clear All Caches Now</Button>
          <Button type="button" variant="outline" size="sm">Clear Pricing Cache Only</Button>
        </div>
      </SectionCard>
      <SectionCard
        title="Backup & Maintenance"
        description="Configure automated system backups and manual snapshots."
      >
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Auto-Backup Frequency</Label>
            <select
              name="backupFrequencyHours"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={val("backupFrequencyHours", "24")}
            >
              <option value="6">Every 6 Hours</option>
              <option value="12">Every 12 Hours</option>
              <option value="24">Daily (Every 24 Hours)</option>
              <option value="48">Every 2 Days</option>
              <option value="168">Weekly (Every 7 Days)</option>
            </select>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <Button
              type="button"
              variant="default"
              onClick={async () => {
                const res = await fetch("/api/admin/settings/backup/create", { method: "POST" });
                if (res.ok) {
                  alert("Backup initiated successfully!");
                  router.refresh();
                } else {
                  alert("Failed to initiate backup.");
                }
              }}
            >
              Run Manual System Backup Now
            </Button>
            <p className="text-xs text-muted-foreground">
              Last backup: {val("lastBackupAt", "Never")}
            </p>
          </div>
        </div>
      </SectionCard>
      <SectionCard
        title="Feature Flags"
        description="Toggle experimental or optional features."
      >
        <div className="space-y-2">
          {FEATURE_FLAGS.map((name) => (
            <SettingsSwitch
              key={name}
              name={flagKey(name)}
              defaultValue={name === "Referral Programme" ? flagChecked(name) : flagChecked(name) !== false}
              label={name}
            />
          ))}
        </div>
      </SectionCard>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
        </Button>
        {saved && <p className="text-sm text-green-600 font-medium">Settings saved.</p>}
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>
    </form>
  );
}
