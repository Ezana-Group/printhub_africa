"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Material = {
  id: string;
  slug: string | null;
  name: string;
  pricePerSqMeter: unknown;
  sortOrder: number;
};

export function QuotePricingEditor() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/quote/materials")
      .then((res) => res.json())
      .then((data) => {
        setMaterials(Array.isArray(data) ? data : []);
        setDraftPrices(
          (Array.isArray(data) ? data : []).reduce(
            (acc: Record<string, string>, m: Material) => {
              acc[m.id] = String(Number(m.pricePerSqMeter));
              return acc;
            },
            {}
          )
        );
      })
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (id: string) => {
    const raw = draftPrices[id];
    const price = raw ? parseInt(raw, 10) : NaN;
    if (Number.isNaN(price) || price < 0) return;
    setSavingId(id);
    try {
      const res = await fetch("/api/admin/quote/materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pricePerSqm: price }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Large format — price per m² (KES)</CardTitle>
        <CardDescription>
          Prices per m² used on the{" "}
          <a href="/services/large-format" className="text-primary hover:underline" target="_blank" rel="noreferrer">
            large-format instant quote
          </a>{" "}
          calculator. Edit and save to update.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Material</th>
                <th className="text-left p-4 font-medium">Slug</th>
                <th className="text-left p-4 font-medium">Price per m² (KES)</th>
                <th className="text-left p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">{m.name}</td>
                  <td className="p-4 text-muted-foreground">{m.slug ?? "—"}</td>
                  <td className="p-4">
                    <Input
                      type="number"
                      min={0}
                      value={draftPrices[m.id] ?? ""}
                      onChange={(e) =>
                        setDraftPrices((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      className="w-28"
                    />
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={savingId === m.id}
                      onClick={() => handleSave(m.id)}
                    >
                      {savingId === m.id ? "Saving…" : "Save"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {materials.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            No quote materials. Run <code className="rounded bg-muted px-1">npm run db:seed</code> to create them.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
