"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Material = { id: string; slug: string; name: string; type: string; pricePerGram: number; density: number; minChargeGrams: number };
type Machine = { code: string; name: string; ratePerHour: number };
type Turnaround = { code: string; name: string; surchargePercent: number };
type Addon = { code: string; name: string; pricePerUnit: number };

type Options = {
  materials: Material[];
  machines: Machine[];
  turnaround: Turnaround[];
  supportRemoval: Addon[];
  finishing: Addon[];
};

type EstimateResult = {
  adjWeightG: number;
  adjPrintTimeHrs: number;
  materialCost: number;
  machineTimeCost: number;
  postProcessingCost: number;
  printSubtotal: number;
  rushSurchargeAmount: number;
  designFee: number;
  subtotalExVat: number;
  vat: number;
  totalFinal: number;
  estimateRangeLow: number;
  estimateRangeHigh: number;
  breakdown: { label: string; amount: number }[];
  disclaimer: string;
};

const INFILL_OPTIONS = [10, 15, 20, 30, 40, 50, 75, 100];
const LAYER_OPTIONS = [0.1, 0.15, 0.2, 0.25, 0.3];
const SHAPE_OPTIONS = [
  { value: "simple", label: "Simple / Geometric" },
  { value: "moderate", label: "Moderate" },
  { value: "complex", label: "Complex" },
  { value: "dense", label: "Very dense" },
];

export function ThreeDCalculator() {
  const [options, setOptions] = useState<Options | null>(null);
  const [lengthMm, setLengthMm] = useState(80);
  const [widthMm, setWidthMm] = useState(60);
  const [heightMm, setHeightMm] = useState(120);
  const [shapeComplexity, setShapeComplexity] = useState("moderate");
  const [materialSlug, setMaterialSlug] = useState("");
  const [machineCode] = useState("FDM_STD");
  const [infillPercent, setInfillPercent] = useState(20);
  const [layerHeightMm, setLayerHeightMm] = useState(0.2);
  const [supportCode, setSupportCode] = useState("NONE");
  const [supportRemovalCode, setSupportRemovalCode] = useState("SUP_RM_NONE");
  const [finishingCode, setFinishingCode] = useState("FINISH_RAW");
  const [turnaroundCode, setTurnaroundCode] = useState("STD_3D");
  const [quantity, setQuantity] = useState(1);
  const [weightG, setWeightG] = useState<number | "">("");
  const [printTimeHrs, setPrintTimeHrs] = useState<number | "">("");
  const [postProcessing, setPostProcessing] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/calculator/3d-print");
      if (!res.ok) return;
      const data = await res.json();
      setOptions(data);
      if (data.materials?.length && !materialSlug) setMaterialSlug(data.materials[0].slug ?? data.materials[0].id);
    } catch {
      setOptions(null);
    }
  }, [materialSlug]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const w = Number(weightG) || 0;
  const t = Number(printTimeHrs) || 0;
  const useWeightAndTime = w > 0 && t > 0;

  const fetchEstimate = useCallback(async () => {
    if (!options) return;
    const currentMaterial = materialSlug || (options.materials?.[0]?.slug ?? options.materials?.[0]?.id ?? "");
    if (!currentMaterial) return;
    if (useWeightAndTime) {
      setLoading(true);
      try {
        const res = await fetch("/api/calculator/3d-print", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialSlug: currentMaterial,
            weightG: w,
            printTimeHrs: t,
            postProcessing,
            quantity,
            designFee: 0,
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
      return;
    }
    if (!lengthMm || !widthMm || !heightMm) {
      setEstimate(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/calculator/3d-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lengthMm,
          widthMm,
          heightMm,
          shapeComplexity,
          materialSlug: currentMaterial,
          machineCode,
          infillPercent,
          layerHeightMm,
          supportCode,
          supportRemovalCode,
          finishingCode,
          turnaroundCode,
          designFee: 0,
          quantity,
        }),
      });
      const data = await res.json();
      if (data.success && data.estimate) setEstimate(data.estimate);
      else setEstimate(null);
    } catch {
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, [
    w,
    t,
    useWeightAndTime,
    lengthMm,
    widthMm,
    heightMm,
    shapeComplexity,
    materialSlug,
    postProcessing,
    machineCode,
    infillPercent,
    layerHeightMm,
    supportCode,
    supportRemovalCode,
    finishingCode,
    turnaroundCode,
    quantity,
    options,
  ]);

  useEffect(() => {
    if (!options) return;
    if (useWeightAndTime || (lengthMm && widthMm && heightMm)) {
      const timeoutId = setTimeout(fetchEstimate, 250);
      return () => clearTimeout(timeoutId);
    }
    setEstimate(null);
  }, [fetchEstimate, options, useWeightAndTime, lengthMm, widthMm, heightMm]);

  if (!options) return <p className="text-sm text-slate-500">Loading calculator…</p>;

  const materials = options.materials ?? [];
  const currentMaterial = materialSlug || (materials[0]?.slug ?? materials[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-slate-700">Length (mm)</Label>
          <Input
            type="number"
            min={1}
            value={lengthMm}
            onChange={(e) => setLengthMm(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-slate-700">Width (mm)</Label>
          <Input
            type="number"
            min={1}
            value={widthMm}
            onChange={(e) => setWidthMm(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="mt-1 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-slate-700">Height (mm)</Label>
          <Input
            type="number"
            min={1}
            value={heightMm}
            onChange={(e) => setHeightMm(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="mt-1 rounded-xl"
          />
        </div>
      </div>

      <div>
        <Label className="text-slate-700">Shape complexity</Label>
        <select
          value={shapeComplexity}
          onChange={(e) => setShapeComplexity(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
        >
          {SHAPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-slate-700">Material</Label>
        <select
          value={currentMaterial}
          onChange={(e) => setMaterialSlug(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.slug ?? m.id}>
              {m.name} — KES {m.pricePerGram}/g
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-3">
        <p className="text-sm font-medium text-slate-700">Or use weight &amp; print time (e.g. from your slicer)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-600 text-sm">Weight (grams)</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={weightG === "" ? "" : weightG}
              onChange={(e) => setWeightG(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="e.g. 50"
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-slate-600 text-sm">Print time (hours)</Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={printTimeHrs === "" ? "" : printTimeHrs}
              onChange={(e) => setPrintTimeHrs(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="e.g. 2.5"
              className="mt-1 rounded-xl"
            />
          </div>
        </div>
        {useWeightAndTime && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="post-processing"
              checked={postProcessing}
              onChange={(e) => setPostProcessing(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary"
            />
            <Label htmlFor="post-processing" className="text-sm text-slate-600">Post-processing (support removal + finishing)</Label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-700">Infill %</Label>
          <select
            value={infillPercent}
            onChange={(e) => setInfillPercent(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {INFILL_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}% {p === 20 && "(recommended)"}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-slate-700">Layer height (mm)</Label>
          <select
            value={layerHeightMm}
            onChange={(e) => setLayerHeightMm(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {LAYER_OPTIONS.map((h) => (
              <option key={h} value={h}>{h} mm {h === 0.2 && "(standard)"}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label className="text-slate-700">Supports</Label>
        <select
          value={supportCode}
          onChange={(e) => setSupportCode(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
        >
          <option value="NONE">None</option>
          <option value="SUP_STD">Standard</option>
          <option value="SUP_HVY">Heavy</option>
        </select>
      </div>

      {options.supportRemoval?.length > 0 && (
        <div>
          <Label className="text-slate-700">Support removal</Label>
          <select
            value={supportRemovalCode}
            onChange={(e) => setSupportRemovalCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {options.supportRemoval.map((a) => (
              <option key={a.code} value={a.code}>{a.name} {a.pricePerUnit > 0 ? `(KES ${a.pricePerUnit})` : ""}</option>
            ))}
          </select>
        </div>
      )}

      {options.finishing?.length > 0 && (
        <div>
          <Label className="text-slate-700">Finishing</Label>
          <select
            value={finishingCode}
            onChange={(e) => setFinishingCode(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            {options.finishing.map((a) => (
              <option key={a.code} value={a.code}>{a.name} {a.pricePerUnit > 0 ? `(KES ${a.pricePerUnit})` : ""}</option>
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
              <option key={t.code} value={t.code}>{t.name} {t.surchargePercent > 0 ? `(+${t.surchargePercent}%)` : ""}</option>
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
          className="mt-1 w-28 rounded-xl"
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        {loading && <p className="text-sm text-slate-500">Calculating…</p>}
        {estimate && !loading && (
          <>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 mb-4">
              <p className="text-sm font-medium text-slate-600 mb-1">Estimated price</p>
              <p className="text-2xl font-bold text-primary">
                KES {estimate.totalFinal.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Range: KES {estimate.estimateRangeLow.toLocaleString()} – KES {estimate.estimateRangeHigh.toLocaleString()}
              </p>
            </div>
            {estimate.adjWeightG > 0 && (
              <p className="text-sm text-slate-600">Est. weight: {estimate.adjWeightG.toFixed(0)}g · Est. time: {estimate.adjPrintTimeHrs.toFixed(1)} hrs</p>
            )}
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
                    <span>KES {row.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500 mt-2">{estimate.disclaimer}</p>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/get-a-quote">Upload design to get a quote</Link>
        </Button>
      </div>
    </div>
  );
}
