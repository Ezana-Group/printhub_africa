"use client";

import { useState, useEffect } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const ORDER_TYPES = [
  { key: "SHOP", label: "Shop" },
  { key: "POD", label: "Print on Demand" },
  { key: "LARGE_FORMAT", label: "Large Format Printing" },
  { key: "THREE_D_PRINT", label: "3D Printed Products" },
  { key: "QUOTE", label: "Quote" },
  { key: "CUSTOM_PRINT", label: "Custom Print" },
] as const;

const DEFAULT_PREFIXES: Record<string, string> = {
  SHOP: "PHUB",
  POD: "POD",
  LARGE_FORMAT: "LF",
  THREE_D_PRINT: "3DP",
  QUOTE: "Q",
  CUSTOM_PRINT: "CP",
};

type Prefixes = Record<string, string>;

export function OrderNumberPrefixesSection() {
  const [prefixes, setPrefixes] = useState<Prefixes>({ ...DEFAULT_PREFIXES });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings/system");
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const custom = (data.orderNumberPrefixes ?? {}) as Prefixes;
        const next: Prefixes = { ...DEFAULT_PREFIXES };
        for (const { key } of ORDER_TYPES) {
          if (typeof custom[key] === "string" && custom[key].trim()) {
            next[key] = custom[key].trim();
          }
        }
        setPrefixes(next);
      } catch {
        if (!cancelled) setError("Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/system", {
        method: "GET",
      });
      const existing = await res.json().catch(() => ({}));
      const orderNumberPrefixes: Prefixes = {};
      for (const { key } of ORDER_TYPES) {
        orderNumberPrefixes[key] = (prefixes[key] ?? DEFAULT_PREFIXES[key] ?? "").trim()
          .replace(/[^A-Za-z0-9_-]/g, "")
          .slice(0, 12) || DEFAULT_PREFIXES[key];
      }
      const body = { ...existing, orderNumberPrefixes };
      const postRes = await fetch("/api/admin/settings/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!postRes.ok) {
        const err = await postRes.json().catch(() => ({}));
        setError(err.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SectionCard
        title="Order number prefixes"
        description="Prefix for each order type. The number after the prefix is generated automatically (e.g. PHUB-00001, POD-00002)."
      >
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Order number prefixes"
      description="Prefix for each order type. The number after the prefix is generated automatically (e.g. PHUB-00001, POD-00002)."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {ORDER_TYPES.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`prefix-${key}`}>{label}</Label>
            <Input
              id={`prefix-${key}`}
              value={prefixes[key] ?? ""}
              onChange={(e) => setPrefixes((p) => ({ ...p, [key]: e.target.value }))}
              placeholder={DEFAULT_PREFIXES[key]}
              className="max-w-[140px] font-mono"
              maxLength={12}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          variant={error ? "destructive" : "default"}
          className={saved ? "bg-green-600 hover:bg-green-600 text-white" : ""}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : saved ? "Saved" : "Save order prefixes"}
        </Button>
        {saved && <p className="text-sm text-green-600 font-medium">Order number prefixes saved.</p>}
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>
    </SectionCard>
  );
}
