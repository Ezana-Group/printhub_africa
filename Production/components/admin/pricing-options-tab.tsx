"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Lamination = { id: string; slug: string | null; name: string; pricePerSqm: unknown };

export function PricingOptionsTab() {
  const router = useRouter();
  const [lamination, setLamination] = useState<Lamination[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/lamination")
      .then((r) => r.json())
      .then((data) => {
        setLamination(Array.isArray(data) ? data : []);
        setDraftPrices(
          (Array.isArray(data) ? data : []).reduce(
            (acc: Record<string, string>, m: Lamination) => {
              acc[m.id] = String(Number(m.pricePerSqm));
              return acc;
            },
            {}
          )
        );
      })
      .catch(() => setLamination([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveLamination = async (id: string) => {
    const raw = draftPrices[id];
    const price = raw ? parseFloat(raw) : NaN;
    if (Number.isNaN(price) || price < 0) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/lamination/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerSqm: price }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Edit rates used by the large-format and 3D calculators. Other options (finishing, design, turnaround) can be managed via database or future admin screens.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Lamination (KES per m²)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Price per m² (KES)</th>
                  <th className="text-left p-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {lamination.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{l.name}</td>
                    <td className="p-4">
                      <Input
                        type="number"
                        min={0}
                        value={draftPrices[l.id] ?? ""}
                        onChange={(e) => setDraftPrices((prev) => ({ ...prev, [l.id]: e.target.value }))}
                        className="w-28"
                      />
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="secondary" disabled={savingId === l.id} onClick={() => handleSaveLamination(l.id)}>
                        {savingId === l.id ? "Saving…" : "Save"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lamination.length === 0 && <p className="p-4 text-muted-foreground text-sm">No lamination options. Run db:seed.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
