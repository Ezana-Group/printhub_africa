"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Material = { id: string; slug: string; name: string; pricePerSqm: number };
type Lamination = { id: string; slug: string; name: string; pricePerSqm: number };
type Finishing = { code: string; name: string; pricePerUnit: number };
type Design = { code: string; name: string; flatFee: number };
type Turnaround = { code: string; name: string; surchargePercent: number };

type Options = {
  materials: Material[];
  lamination: Lamination[];
  finishing: Finishing[];
  design: Design[];
  turnaround: Turnaround[];
};

type EstimateResult = {
  areaSqm: number;
  areaChargedSqm: number;
  baseCost: number;
  volumeDiscountPercent: number;
  volumeDiscountAmount: number;
  discountedBase: number;
  laminationCost: number;
  finishingCost: number;
  printSubtotal: number;
  rushSurchargeAmount: number;
  designFee: number;
  subtotalExVat: number;
  vat: number;
  totalEstimate: number;
  totalRounded: number;
  totalFinal: number;
  breakdown: { label: string; amount: number }[];
  disclaimer: string;
};

const DEFAULT_OPTIONS: Options = {
  materials: [],
  lamination: [],
  finishing: [],
  design: [],
  turnaround: [],
};

export function LargeFormatCalculator({ materials: initialMaterials = [] }: { materials?: { id: string; name: string; pricePerSqm: number }[] }) {
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(150);
  const [materialSlug, setMaterialSlug] = useState("");
  const [laminationSlug, setLaminationSlug] = useState("NONE");
  const [finishingCodes, setFinishingCodes] = useState<string[]>([]);
  const [designCode, setDesignCode] = useState("NONE");
  const [turnaroundCode, setTurnaroundCode] = useState("STD");
  const [quantity, setQuantity] = useState(1);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/calculator/large-format");
      if (!res.ok) return;
      const data = await res.json();
      setOptions(data);
      if (!materialSlug && data.materials?.length) setMaterialSlug(data.materials[0].slug ?? data.materials[0].id);
    } catch {
      if (initialMaterials.length) {
        setOptions((o) => ({ ...o, materials: initialMaterials.map((m) => ({ ...m, slug: m.id })) }));
        setMaterialSlug(initialMaterials[0]?.id ?? "");
      }
    }
  }, [initialMaterials, materialSlug]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const materials = options.materials.length ? options.materials : initialMaterials.map((m) => ({ ...m, slug: m.id }));
  const currentMaterialSlug = materialSlug || (materials[0]?.slug ?? materials[0]?.id ?? "");

  const fetchEstimate = useCallback(async () => {
    if (!currentMaterialSlug) return;
    setLoading(true);
    try {
      const res = await fetch("/api/calculator/large-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widthCm: width,
          heightCm: height,
          materialSlug: currentMaterialSlug,
          laminationSlug: laminationSlug || "NONE",
          finishingCodes,
          designCode: designCode || "NONE",
          turnaroundCode: turnaroundCode || "STD",
          quantity,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.estimate) setEstimate(data.estimate);
      else setEstimate(null);
    } catch {
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, [width, height, currentMaterialSlug, laminationSlug, finishingCodes, designCode, turnaroundCode, quantity]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchEstimate, 250);
    return () => clearTimeout(timeoutId);
  }, [fetchEstimate]);

  const toggleFinishing = (code: string) => {
    setFinishingCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const areaSqm = (width * height) / 10000;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-700">Width (cm)</Label>
          <Input
            type="number"
            min={1}
            value={width}
            onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-slate-700">Height (cm)</Label>
          <Input
            type="number"
            min={1}
            value={height}
            onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="mt-1 rounded-xl"
          />
        </div>
      </div>
      <p className="text-sm text-slate-600">Area: {areaSqm.toFixed(2)} m² {areaSqm < 0.5 && "(min 0.5 m² charged)"}</p>

      <div>
        <Label className="text-slate-700">Material</Label>
        <select
          value={currentMaterialSlug}
          onChange={(e) => setMaterialSlug(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.slug ?? m.id}>
              {m.name} — KES {m.pricePerSqm}/m²
            </option>
          ))}
        </select>
      </div>

      {options.lamination?.length > 0 && (
        <div>
          <Label className="text-slate-700">Lamination</Label>
          <select
            value={laminationSlug}
            onChange={(e) => setLaminationSlug(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {options.lamination.map((l) => (
              <option key={l.id} value={l.slug ?? l.id}>
                {l.name} {l.pricePerSqm > 0 ? `— KES ${l.pricePerSqm}/m²` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {options.finishing?.length > 0 && (
        <div>
          <Label className="text-slate-700">Finishing (optional)</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {options.finishing.filter((f) => f.code !== "NONE").map((f) => (
              <label key={f.code} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={finishingCodes.includes(f.code)}
                  onChange={() => toggleFinishing(f.code)}
                />
                <span>{f.name} (KES {f.pricePerUnit})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {options.design?.length > 0 && (
        <div>
          <Label className="text-slate-700">Design / artwork</Label>
          <select
            value={designCode}
            onChange={(e) => setDesignCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {options.design.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name} {d.flatFee > 0 ? `— KES ${d.flatFee}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {options.turnaround?.length > 0 && (
        <div>
          <Label className="text-slate-700">Turnaround</Label>
          <select
            value={turnaroundCode}
            onChange={(e) => setTurnaroundCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {options.turnaround.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name} {t.surchargePercent > 0 ? `(+${t.surchargePercent}%)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label className="text-slate-700">Quantity</Label>
        <Input
          type="number"
          min={1}
          max={999}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))}
          className="mt-1 w-full max-w-[120px] rounded-xl"
        />
        {quantity >= 5 && (
          <p className="text-xs text-green-600 mt-1">Volume discount applied</p>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4">
        {loading && <p className="text-sm text-slate-500">Calculating…</p>}
        {estimate && !loading && (
          <>
            <p className="text-xl font-bold text-primary">KES {estimate.totalFinal.toLocaleString()}</p>
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="text-sm text-slate-600 hover:underline mt-1"
            >
              {showBreakdown ? "Hide" : "Show"} breakdown
            </button>
            {showBreakdown && (
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {estimate.breakdown.map((row) => (
                  <li key={row.label} className="flex justify-between">
                    <span>{row.label}</span>
                    <span>{row.amount < 0 ? "-" : ""} KES {Math.abs(row.amount).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500 mt-2">{estimate.disclaimer}</p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild className="rounded-xl" variant="outline">
          <Link href="/get-a-quote">Upload design to get a quote</Link>
        </Button>
      </div>
    </div>
  );
}
