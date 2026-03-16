"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LegalPagesSeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/legal/seed", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Seed failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to prepopulate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900 mb-3">
        No legal pages in the database. Click below to prepopulate all 6 pages (Privacy Policy,
        Terms of Service, Refund and Returns Policy, Cookie Policy, Account Registration Terms,
        Corporate Account Terms) from the default Kenya-law content. You can edit them after.
      </p>
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Prepopulating…" : "Prepopulate legal pages"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
