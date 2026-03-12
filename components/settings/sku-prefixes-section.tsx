"use client";

import { useState, useEffect } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const DEFAULT_SKU_PREFIX = "PRD";
const MAX_PREFIX_LEN = 12;

type Category = { id: string; name: string; slug: string };
type PrefixByCategory = Record<string, string>;

export function SkuPrefixesSection() {
  const [defaultPrefix, setDefaultPrefix] = useState(DEFAULT_SKU_PREFIX);
  const [prefixByCategoryId, setPrefixByCategoryId] = useState<PrefixByCategory>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [settingsRes, categoriesRes] = await Promise.all([
          fetch("/api/admin/settings/system"),
          fetch("/api/admin/categories"),
        ]);
        if (cancelled) return;
        const data = await settingsRes.json().catch(() => ({}));
        const defaultP =
          typeof data.skuDefaultPrefix === "string" && data.skuDefaultPrefix.trim()
            ? data.skuDefaultPrefix.trim().slice(0, MAX_PREFIX_LEN)
            : DEFAULT_SKU_PREFIX;
        setDefaultPrefix(defaultP);
        if (data.skuPrefixByCategoryId && typeof data.skuPrefixByCategoryId === "object") {
          setPrefixByCategoryId({ ...data.skuPrefixByCategoryId });
        }
        if (categoriesRes.ok) {
          const cats = (await categoriesRes.json()) as Category[];
          setCategories(Array.isArray(cats) ? cats : []);
        }
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

  const sanitize = (s: string) =>
    s
      .trim()
      .replace(/[^A-Za-z0-9_-]/g, "")
      .slice(0, MAX_PREFIX_LEN);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/system", { method: "GET" });
      const existing = await res.json().catch(() => ({}));
      const skuDefaultPrefix =
        sanitize(defaultPrefix) || DEFAULT_SKU_PREFIX;
      const skuPrefixByCategoryId: PrefixByCategory = {};
      for (const c of categories) {
        const v = prefixByCategoryId[c.id];
        if (typeof v === "string" && v.trim()) {
          const cleaned = sanitize(v);
          if (cleaned) skuPrefixByCategoryId[c.id] = cleaned;
        }
      }
      const body = { ...existing, skuDefaultPrefix, skuPrefixByCategoryId };
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
        title="SKU prefixes"
        description="Default and per-category prefixes for auto-generated product SKUs (e.g. PRD-00001, VINYL-00002)."
      >
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="SKU prefixes"
      description="Default and per-category prefixes for auto-generated product SKUs (e.g. PRD-00001, VINYL-00002). Leave category prefix blank to use the default."
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-1.5 max-w-[200px]">
          <Label htmlFor="sku-default-prefix">Default prefix (all categories)</Label>
          <Input
            id="sku-default-prefix"
            value={defaultPrefix}
            onChange={(e) => setDefaultPrefix(e.target.value)}
            placeholder={DEFAULT_SKU_PREFIX}
            className="font-mono"
            maxLength={MAX_PREFIX_LEN}
          />
        </div>
        {categories.length > 0 && (
          <div>
            <Label className="mb-2 block">Per-category overrides (optional)</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((c) => (
                <div key={c.id} className="flex flex-col gap-1">
                  <Label htmlFor={`sku-cat-${c.id}`} className="text-muted-foreground font-normal">
                    {c.name}
                  </Label>
                  <Input
                    id={`sku-cat-${c.id}`}
                    value={prefixByCategoryId[c.id] ?? ""}
                    onChange={(e) =>
                      setPrefixByCategoryId((p) => ({
                        ...p,
                        [c.id]: e.target.value,
                      }))
                    }
                    placeholder={defaultPrefix}
                    className="max-w-[140px] font-mono"
                    maxLength={MAX_PREFIX_LEN}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
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
          {saving ? "Saving…" : saved ? "Saved" : "Save SKU prefixes"}
        </Button>
        {saved && (
          <p className="text-sm text-green-600 font-medium">SKU prefixes saved.</p>
        )}
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>
    </SectionCard>
  );
}
