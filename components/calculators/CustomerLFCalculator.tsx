"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLFRates } from "@/hooks/useLFRates";
import {
  calculateLFPrintCost,
  roundLFToNearest10,
  type LFJobInputs,
  type LFMaterialCosts,
} from "@/lib/lf-calculator-engine";
import { Layout, AlertCircle } from "lucide-react";

type CustomerLFCalculatorProps = {
  variant?: "light" | "dark";
  onEstimateChange?: (low: number | null, high: number | null) => void;
  onMaterialChange?: (code: string, name: string) => void;
};

export function CustomerLFCalculator({
  variant = "dark",
  onEstimateChange,
  onMaterialChange,
}: CustomerLFCalculatorProps) {
  const { data: rates, loading: ratesLoading } = useLFRates();
  const [materialCode, setMaterialCode] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [laminationCode, setLaminationCode] = useState("NONE");
  const [addOnsOpen, setAddOnsOpen] = useState(false);
  const [finishingEyelets, setFinishingEyelets] = useState<"NONE" | "STANDARD" | "HEAVY">("NONE");
  const [finishingHemming, setFinishingHemming] = useState<"NONE" | "ALL_4" | "TOP_BOTTOM">("NONE");
  const [finishingRope, setFinishingRope] = useState(false);
  const [rushMultiplier, setRushMultiplier] = useState(1);

  const materials = rates?.materials ?? [];
  const laminations = rates?.laminations ?? [];
  const rushOptions = rates?.rushOptions ?? [];

  useEffect(() => {
    if (materials.length && !materialCode) setMaterialCode(materials[0].code);
  }, [materials, materialCode]);

  useEffect(() => {
    if (materialCode && materials.length) {
      const m = materials.find((x) => x.code === materialCode);
      if (m) onMaterialChange?.(m.code, m.name);
    }
  }, [materialCode, materials, onMaterialChange]);

  const { estimateLow, estimateHigh } = useMemo(() => {
    if (!rates || ratesLoading) return { estimateLow: null, estimateHigh: null };
    const w = Number(widthCm) || 0;
    const h = Number(heightCm) || 0;
    if (!w || !h || w <= 0 || h <= 0) return { estimateLow: null, estimateHigh: null };

    const mat = materials.find((m) => m.code === materialCode) ?? materials[0];
    const lam = laminations.find((l) => l.code === laminationCode);
    if (!mat) return { estimateLow: null, estimateHigh: null };

    const job: LFJobInputs = {
      widthM: w / 100,
      heightM: h / 100,
      quantity,
      materialCode: mat.code,
      laminationCode: laminationCode === "NONE" ? "NONE" : (lam?.code ?? "NONE"),
      finishing: {
        eyelets: finishingEyelets,
        hemming: finishingHemming,
        polePockets: "NONE",
        rope: finishingRope,
      },
      printType: "CMYK",
      designFeeKes: 0,
      rushMultiplier,
    };

    const materialCosts: LFMaterialCosts = {
      substrateCode: mat.code,
      substrateCostPerLm: mat.averageCostKes,
      substrateRollWidthM: mat.rollWidthM ?? 1.52,
      laminationCode: lam?.code ?? null,
      laminationCostPerLm: lam?.averageCostKes ?? 0,
      inkCostPerSqm: rates.inkCosts.CMYK,
      eyeletCostPerUnit: rates.finishingHardware.eyeletCostPerUnit,
      hemTapeCostPerM: rates.finishingHardware.hemTapeCostPerM,
      ropeCostPerM: rates.finishingHardware.ropeCostPerM,
      polePocketCostPerM: rates.finishingHardware.polePocketCostPerM,
      packagingCostKes: rates.finishingHardware.packagingCostKes,
    };

    const result = calculateLFPrintCost(
      job,
      rates.printerSettings,
      rates.businessSettings,
      materialCosts
    );
    const low = roundLFToNearest10(result.totalIncVat * 0.85);
    const high = roundLFToNearest10(result.totalIncVat * 1.25);
    return { estimateLow: low, estimateHigh: high, totalIncVat: result.totalIncVat };
  }, [
    rates,
    ratesLoading,
    widthCm,
    heightCm,
    quantity,
    materialCode,
    laminationCode,
    finishingEyelets,
    finishingHemming,
    finishingRope,
    rushMultiplier,
    materials,
    laminations,
  ]);

  useEffect(() => {
    onEstimateChange?.(estimateLow, estimateHigh);
  }, [estimateLow, estimateHigh, onEstimateChange]);

  const areaSqm = useMemo(() => {
    const w = Number(widthCm) || 0;
    const h = Number(heightCm) || 0;
    return w && h ? (w / 100) * (h / 100) : 0;
  }, [widthCm, heightCm]);

  const isDark = variant === "dark";

  return (
    <Card className={isDark ? "border-slate-200 bg-slate-50/50" : "border-slate-200"}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layout className="h-5 w-5 text-primary" />
          Large format options
        </CardTitle>
        <CardDescription>Size, material, quantity, and add-ons. Estimate updates as you change options.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {ratesLoading && (
          <p className="text-sm text-muted-foreground">Loading options…</p>
        )}
        {!ratesLoading && rates && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-slate-700">Width (cm)</Label>
                <Input
                  type="number"
                  min={1}
                  value={widthCm}
                  onChange={(e) => setWidthCm(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  placeholder="e.g. 200"
                />
              </div>
              <div>
                <Label className="text-slate-700">Height (cm)</Label>
                <Input
                  type="number"
                  min={1}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  placeholder="e.g. 100"
                />
              </div>
            </div>
            {areaSqm > 0 && (
              <p className="text-xs text-muted-foreground">Area: {areaSqm.toFixed(2)} m²</p>
            )}
            <div>
              <Label className="text-slate-700">Material</Label>
              <select
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-slate-800"
              >
                {materials.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                    {m.isLowStock && " (low stock)"}
                    {m.isOutOfStock && " (out of stock)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-slate-700">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))
                  }
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-slate-700">Lamination</Label>
                <select
                  value={laminationCode}
                  onChange={(e) => setLaminationCode(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-slate-800"
                >
                  <option value="NONE">None</option>
                  {laminations.filter((l) => l.code !== "NONE").map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setAddOnsOpen((o) => !o)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {addOnsOpen ? "▼ Hide add-ons" : "▶ Finishing & turnaround"}
              </button>
              {addOnsOpen && (
                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div>
                    <Label className="text-slate-700 text-xs">Eyelets</Label>
                    <select
                      value={finishingEyelets}
                      onChange={(e) =>
                        setFinishingEyelets(e.target.value as "NONE" | "STANDARD" | "HEAVY")
                      }
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="NONE">None</option>
                      <option value="STANDARD">Standard (every 50cm)</option>
                      <option value="HEAVY">Heavy duty (every 30cm)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-700 text-xs">Hemming</Label>
                    <select
                      value={finishingHemming}
                      onChange={(e) =>
                        setFinishingHemming(e.target.value as "NONE" | "ALL_4" | "TOP_BOTTOM")
                      }
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="NONE">None</option>
                      <option value="ALL_4">All 4 sides</option>
                      <option value="TOP_BOTTOM">Top & bottom</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={finishingRope}
                      onChange={(e) => setFinishingRope(e.target.checked)}
                      className="rounded border-slate-300 text-primary"
                    />
                    Rope / bungee
                  </label>
                  {rushOptions.length > 0 && (
                    <div>
                      <Label className="text-slate-700 text-xs">Turnaround</Label>
                      <select
                        value={rushMultiplier}
                        onChange={(e) => setRushMultiplier(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {rushOptions.map((r) => (
                          <option key={r.code} value={r.multiplier}>
                            {r.name}
                            {r.surchargePercent > 0 ? ` (+${r.surchargePercent}%)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {estimateLow != null && estimateHigh != null && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-slate-700">Your estimate</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  KES {estimateLow.toLocaleString()} – KES {estimateHigh.toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-1">(includes {rates.vatRatePct}% VAT)</p>
                <div className="flex items-start gap-2 mt-3 text-xs text-slate-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    This is an estimate. Final price confirmed within 2 hours of submitting your files.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
