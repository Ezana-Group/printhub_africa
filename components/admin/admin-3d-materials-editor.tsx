"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ThreeDMaterial = {
  id: string;
  slug: string | null;
  name: string;
  pricePerGram: number | string;
  colorOptions: string[];
};

export function Admin3DMaterialsEditor() {
  const router = useRouter();
  const [materials, setMaterials] = useState<ThreeDMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState<Record<string, string>>({});
  const [draftColors, setDraftColors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/quote/3d-materials")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMaterials(list);
        setDraftPrice(
          list.reduce(
            (acc: Record<string, string>, m: ThreeDMaterial) => {
              acc[m.id] = String(Number(m.pricePerGram));
              return acc;
            },
            {}
          )
        );
        setDraftColors(
          list.reduce(
            (acc: Record<string, string>, m: ThreeDMaterial) => {
              acc[m.id] = (m.colorOptions ?? []).join(", ");
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
    const priceRaw = draftPrice[id];
    const pricePerGram = priceRaw ? parseFloat(priceRaw) : NaN;
    const colorsStr = (draftColors[id] ?? "").trim();
    const colorOptions = colorsStr
      ? colorsStr.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload: { id: string; pricePerGram?: number; colorOptions?: string[] } = { id };
    if (!Number.isNaN(pricePerGram) && pricePerGram >= 0) payload.pricePerGram = pricePerGram;
    payload.colorOptions = colorOptions;

    if (Object.keys(payload).length <= 1) return; // only id, nothing to update

    setSavingId(id);
    try {
      const res = await fetch("/api/admin/quote/3d-materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <CardTitle>3D printing — materials &amp; colours</CardTitle>
        <CardDescription>
          Price per gram (KES) and colour options shown on the upload page and calculators. Customers choose a material and colour; colour can affect final pricing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Material</th>
                <th className="text-left p-4 font-medium">Slug</th>
                <th className="text-left p-4 font-medium">Price per gram (KES)</th>
                <th className="text-left p-4 font-medium">Colour options (comma-separated)</th>
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
                      step={0.01}
                      value={draftPrice[m.id] ?? ""}
                      onChange={(e) =>
                        setDraftPrice((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      className="w-28"
                    />
                  </td>
                  <td className="p-4">
                    <Input
                      value={draftColors[m.id] ?? ""}
                      onChange={(e) =>
                        setDraftColors((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      placeholder="e.g. Black, White, Grey, Red"
                      className="min-w-[12rem]"
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
            No 3D materials. Run <code className="rounded bg-muted px-1">npm run db:seed</code> to create them.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
