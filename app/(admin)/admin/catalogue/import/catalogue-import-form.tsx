"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogueImportFormProps {
  categories: Category[];
}

const PRINTABLES_DOMAIN = "printables.com";

/** Try to derive a readable name from a Printables URL path, e.g. /model/12345-cable-organizer -> Cable organizer */
function nameFromPrintablesUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.toLowerCase().includes(PRINTABLES_DOMAIN)) return "";
    const path = u.pathname;
    const match = path.match(/\/model\/[^/]+-(.+)$/);
    if (match && match[1]) {
      const slug = match[1];
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  } catch {
    // ignore
  }
  return "";
}

export function CatalogueImportForm({ categories }: CatalogueImportFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const suggestedName = url ? nameFromPrintablesUrl(url) : "";
  const displayName = nameOverride.trim() || suggestedName || "Imported from Printables";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please paste a Printables.com model URL.");
      return;
    }
    if (!trimmedUrl.toLowerCase().includes(PRINTABLES_DOMAIN)) {
      setError("URL must be from printables.com (e.g. https://www.printables.com/model/...).");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          categoryId,
          sourceType: "PRINTABLES",
          sourceUrl: trimmedUrl,
          shortDescription: undefined,
          description: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? data?.error ?? "Failed to create item");
        return;
      }
      router.push("/admin/catalogue");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="url">Printables.com model URL *</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.printables.com/model/12345-example-name"
          required
        />
        <p className="text-xs text-slate-500">Paste the full URL of the model page.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nameOverride">Item name (optional)</Label>
        <Input
          id="nameOverride"
          value={nameOverride}
          onChange={(e) => setNameOverride(e.target.value)}
          placeholder={suggestedName || "Leave blank to use a default name"}
        />
        {suggestedName && !nameOverride && (
          <p className="text-xs text-slate-500">Suggested from URL: “{suggestedName}”</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category *</Label>
        <select
          id="categoryId"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Importing…" : "Import as draft"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/catalogue">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
