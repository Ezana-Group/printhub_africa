"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalculatorConfig, compute3DEstimateFromConfig } from "@/hooks/useCalculatorConfig";
import { formatKes } from "@/lib/3d-calculator-engine";
import {
  COLOUR_PILLS,
  BRAND_COLOUR_HEX,
  canonicalColorFromSpec,
  colorMatches,
  PREFERRED_MATERIAL_ORDER,
} from "@/lib/3d-colour-utils";
import { Printer, ChevronDown, ChevronUp, HelpCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const WEIGHT_GUIDE = `Rough weight guide:
• Phone stand:        ~30–50g
• Small figurine:     ~50–150g
• Cup / container:    ~100–200g
• Mechanical part:    ~50–300g
• Large model:        200g+
Upload your STL for an accurate calculation.`;

const TIME_GUIDE = `Rough time guide:
• Small object (<50g):     1–3 hours
• Medium object (50–150g): 3–8 hours
• Large object (150g+):    8–24+ hours
These vary by layer height and infill.`;

type MaterialWithColors = {
  code: string;
  name: string;
  costPerKgKes: number;
  baseMaterial?: string;
  color?: string;
  quantity?: number;
};
type CustomerPrintCalculatorProps = {
  variant?: "light" | "dark";
  onEstimateChange?: (low: number | null, high: number | null) => void;
  onMaterialChange?: (code: string, name: string, color?: string) => void;
};

export function CustomerPrintCalculator({ variant = "dark", onEstimateChange, onMaterialChange }: CustomerPrintCalculatorProps) {
  const { data: config, loading: configLoading } = useCalculatorConfig();

  const [materialType, setMaterialType] = useState("");
  const [colorChoice, setColorChoice] = useState("");
  const [weightGrams, setWeightGrams] = useState<number | "">("");
  const [printTimeHours, setPrintTimeHours] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [postProcessing, setPostProcessing] = useState(false);
  const [addOnsOpen, setAddOnsOpen] = useState(false);

  const materials: MaterialWithColors[] = useMemo(() => {
    if (!config?.filaments?.length) return [];
    return config.filaments.map((f) => ({
      code: f.id,
      name: f.name,
      costPerKgKes: f.costPerKg,
      baseMaterial: f.material,
      color: canonicalColorFromSpec(f.colour ?? ""),
      quantity: 1,
    }));
  }, [config?.filaments]);

  const { materialTypes, byMaterialType, availableColorSet, inStockColorSet } = useMemo(() => {
    const byBase: Record<string, { code: string; name: string; color: string; quantity: number }[]> = {};
    for (const m of materials) {
      const base = m.baseMaterial ?? (m.name.replace(/\s*\([^)]*\)\s*$/, "").trim() || m.name);
      if (!byBase[base]) byBase[base] = [];
      const rawColor = m.color ?? ((m.name.match(/\s*\(([^)]+)\)\s*$/) ?? [])[1]?.trim());
      const canonical = canonicalColorFromSpec(rawColor);
      byBase[base].push({ code: m.code, name: m.name, color: canonical, quantity: m.quantity ?? 1 });
    }
    const types = Object.keys(byBase);
    const sorted = [...new Set([...PREFERRED_MATERIAL_ORDER.filter((p) => types.some((t) => t.toLowerCase() === p.toLowerCase())), ...types])];
    const colorSet: Record<string, Set<string>> = {};
    const inStockSet: Record<string, Set<string>> = {};
    for (const t of types) {
      const pillIds = new Set<string>();
      const inStock = new Set<string>();
      for (const x of byBase[t]) {
        const pill = COLOUR_PILLS.find((p) => p.id.toLowerCase() === x.color.toLowerCase());
        if (pill) {
          pillIds.add(pill.id);
          inStock.add(pill.id);
        } else {
          pillIds.add(x.color);
          inStock.add(x.color);
        }
      }
      colorSet[t] = pillIds;
      inStockSet[t] = inStock;
    }
    return { materialTypes: sorted, byMaterialType: byBase, availableColorSet: colorSet, inStockColorSet: inStockSet };
  }, [materials]);

  const effectiveMaterial = useMemo(() => {
    if (!materialType || !byMaterialType[materialType]?.length) return materialTypes.length ? (byMaterialType[materialTypes[0]]?.[0]?.code ?? "") : "";
    const list = byMaterialType[materialType];
    const match = list.find((m) => colorMatches(m.color, colorChoice));
    return match ? match.code : list[0].code;
  }, [materialType, colorChoice, byMaterialType, materialTypes]);

  const availableColorsForType = useMemo(() => availableColorSet[materialType] ?? new Set<string>(), [materialType, availableColorSet]);
  const inStockForType = useMemo(() => inStockColorSet[materialType] ?? new Set<string>(), [materialType, inStockColorSet]);

  // Only set default material/colour when none selected yet — never overwrite user selection (e.g. PETG).
  useEffect(() => {
    if (materialTypes.length === 0 || materialType) return;
    const firstType = materialTypes[0];
    setMaterialType(firstType);
    const inStock = inStockColorSet[firstType];
    const avail = availableColorSet[firstType];
    setColorChoice(inStock?.size ? [...inStock][0] : avail?.size ? [...avail][0] : "Natural/Transparent");
  }, [materialTypes, materialType, availableColorSet, inStockColorSet]);

  useEffect(() => {
    if (materialType && availableColorsForType.size && colorChoice && !availableColorsForType.has(colorChoice)) {
      const first = byMaterialType[materialType]?.[0]?.color;
      setColorChoice(first ? (COLOUR_PILLS.find((p) => colorMatches(first, p.id))?.id ?? "Natural/Transparent") : COLOUR_PILLS[0].id);
    }
  }, [materialType, availableColorsForType, byMaterialType, colorChoice]);

  useEffect(() => {
    if (materialType && colorChoice && availableColorsForType.has(colorChoice) && !inStockForType.has(colorChoice)) {
      const inStock = [...inStockForType];
      setColorChoice(inStock.length ? inStock[0] : [...availableColorsForType][0] ?? "Natural/Transparent");
    }
  }, [materialType, colorChoice, availableColorsForType, inStockForType]);

  useEffect(() => {
    if (effectiveMaterial && materials.length) {
      const mat = materials.find((m) => m.code === effectiveMaterial);
      if (mat) onMaterialChange?.(mat.code, mat.baseMaterial ?? mat.name, colorChoice || undefined);
    }
  }, [effectiveMaterial, materials, colorChoice, onMaterialChange]);

  const selectedFilament = useMemo(
    () => materials.find((m) => m.code === effectiveMaterial),
    [materials, effectiveMaterial]
  );

  const breakdown = useMemo(() => {
    if (!config || !selectedFilament) return null;
    const w = Number(weightGrams) || 0;
    const t = Number(printTimeHours) || 0;
    const qty = Math.max(1, Math.min(999, quantity));
    if (w <= 0 || t <= 0) return null;
    return compute3DEstimateFromConfig(config, {
      weightG: w,
      printTimeHrs: t,
      quantity: qty,
      costPerKg: selectedFilament.costPerKgKes,
      postProcessing,
    });
  }, [config, selectedFilament, weightGrams, printTimeHours, quantity, postProcessing]);

  const priceLow = breakdown?.rangeLow ?? null;
  const priceHigh = breakdown?.rangeHigh ?? null;
  const showEstimate = priceLow != null && priceHigh != null;

  useEffect(() => {
    onEstimateChange?.(priceLow, priceHigh);
  }, [priceLow, priceHigh, onEstimateChange]);

  const isLight = variant === "light";
  const cardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-card p-6 shadow-sm md:p-8"
    : "rounded-2xl border border-[#E8440A]/20 bg-[#0A0A0A] p-6 text-white shadow-xl md:p-8";
  const labelClass = isLight ? "text-slate-700" : "text-white/70";
  const inputClass = isLight
    ? "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-slate-900"
    : "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-[#E8440A] focus:outline-none focus:ring-1 focus:ring-[#E8440A]";
  const accentBg = isLight ? "bg-[#E8440A]" : "bg-[#E8440A]";
  const accentText = isLight ? "text-white" : "text-white";

  if (configLoading || !config) {
    return (
      <div className={isLight ? "rounded-2xl border border-slate-200 bg-card p-8 text-center text-slate-600" : "rounded-2xl border border-[#E8440A]/20 bg-[#0A0A0A] p-8 text-center text-white/60"}>
        Loading calculator…
      </div>
    );
  }

  if (!materials.length) {
    return (
      <div className={isLight ? "rounded-2xl border border-slate-200 bg-card p-8 text-center text-slate-600" : "rounded-2xl border border-[#E8440A]/20 bg-[#0A0A0A] p-8 text-center text-white/60"}>
        No materials configured. Please try again later.
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="mb-6 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentBg} ${accentText}`}>
          <Printer className="h-5 w-5" />
        </span>
        <div>
          <h2 className={`font-display text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
            Get a 3D Print Estimate
          </h2>
          <p className={`mt-0.5 text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
            Fill in your print details — we&apos;ll give you an instant estimate.
            Our team confirms the final price.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className={labelClass}>What material do you need?</Label>
          <select
            value={materialType}
            onChange={(e) => {
              const newType = e.target.value;
              setMaterialType(newType);
              const inStock = inStockColorSet[newType];
              const avail = availableColorSet[newType];
              setColorChoice(inStock?.size ? [...inStock][0] : avail?.size ? [...avail][0] : "Natural/Transparent");
            }}
            className={inputClass}
          >
            {materialTypes.map((mt) => (
              <option key={mt} value={mt}>
                {mt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className={labelClass}>Choose a colour</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLOUR_PILLS.map((pill) => {
              const available = availableColorsForType.has(pill.id);
              const inStock = inStockForType.has(pill.id);
              const disabled = !available || !inStock;
              const selected = colorChoice === pill.id;
              const isWhite = pill.id === "White";
              return (
                <button
                  key={pill.id}
                  type="button"
                  disabled={disabled}
                  title={
                    !available && materialType
                      ? `Not available in ${materialType}`
                      : !inStock && available
                        ? "Out of stock"
                        : pill.label
                  }
                  onClick={() => available && inStock && setColorChoice(pill.id)}
                  className={cn(
                    "relative rounded-full shrink-0 transition-all flex items-center justify-center",
                    selected ? "w-10 h-10" : "w-8 h-8",
                    disabled && "opacity-30 cursor-not-allowed",
                    !disabled && !selected && "hover:opacity-90"
                  )}
                  style={{
                    width: selected ? 40 : 32,
                    height: selected ? 40 : 32,
                    backgroundColor: pill.pattern ? "transparent" : pill.bg,
                    border: isWhite ? "2px solid #CBD5E0" : "1px solid #E2E8F0",
                    boxShadow: isWhite ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                    outline: selected ? `2px solid ${BRAND_COLOUR_HEX}` : "none",
                    outlineOffset: selected ? 2 : 0,
                    backgroundImage: pill.pattern
                      ? "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)"
                      : undefined,
                    backgroundSize: pill.pattern ? "8px 8px" : undefined,
                    backgroundPosition: pill.pattern ? "0 0, 0 4px, 4px -4px, -4px 0px" : undefined,
                  }}
                >
                  {selected && (
                    <Check className="absolute h-5 w-5 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
          <p className={isLight ? "mt-2 text-xs text-slate-500" : "mt-2 text-xs text-white/40"}>
            Don&apos;t see your colour? Add it in the notes below.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className={`flex items-center gap-1.5 ${labelClass}`}>
              Estimated weight (grams)
              <span
                className={isLight ? "cursor-help text-slate-400" : "cursor-help text-white/40"}
                title={WEIGHT_GUIDE}
                aria-label="Weight guide"
              >
                <HelpCircle className="h-4 w-4" />
              </span>
            </Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={weightGrams === "" ? "" : weightGrams}
              onChange={(e) =>
                setWeightGrams(
                  e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                )
              }
              placeholder="e.g. 100"
              className={isLight ? "mt-1.5 rounded-xl" : "mt-1.5 border-white/10 bg-white/5 text-white placeholder:text-white/40"}
            />
            <p className={isLight ? "mt-1 text-xs text-slate-500" : "mt-1 text-xs text-white/40"}>Not sure? Upload your STL and we&apos;ll calculate it.</p>
          </div>
          <div>
            <Label className={`flex items-center gap-1.5 ${labelClass}`}>
              Estimated print time (hours)
              <span
                className={isLight ? "cursor-help text-slate-400" : "cursor-help text-white/40"}
                title={TIME_GUIDE}
                aria-label="Time guide"
              >
                <HelpCircle className="h-4 w-4" />
              </span>
            </Label>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={printTimeHours === "" ? "" : printTimeHours}
              onChange={(e) =>
                setPrintTimeHours(
                  e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0)
                )
              }
              placeholder="e.g. 3.5"
              className={isLight ? "mt-1.5 rounded-xl" : "mt-1.5 border-white/10 bg-white/5 text-white placeholder:text-white/40"}
            />
            <p className={isLight ? "mt-1 text-xs text-slate-500" : "mt-1 text-xs text-white/40"}>Not sure? Use our time guide above.</p>
          </div>
        </div>

        <div>
          <Label className={labelClass}>Quantity</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={isLight ? "h-10 w-10 rounded-xl" : "h-10 w-10 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </Button>
            <Input
              type="number"
              min={1}
              max={999}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1))
                )
              }
              className={isLight ? "w-24 rounded-xl text-center" : "w-24 border-white/10 bg-white/5 text-center text-white"}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={isLight ? "h-10 w-10 rounded-xl" : "h-10 w-10 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"}
              onClick={() => setQuantity((q) => Math.min(999, q + 1))}
            >
              +
            </Button>
          </div>
        </div>

        <details
          className={isLight ? "rounded-xl border border-slate-200 bg-slate-50/50" : "rounded-xl border border-white/10 bg-white/5"}
          open={addOnsOpen}
          onToggle={(e) => setAddOnsOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className={`flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium ${isLight ? "text-slate-900" : "text-white/90"}`}>
            Add-ons (optional)
            {addOnsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </summary>
          <div className={`space-y-3 px-4 pb-4 pt-3 ${isLight ? "border-t border-slate-200" : "border-t border-white/10"}`}>
            <label className={`flex cursor-pointer items-center gap-2 text-sm ${isLight ? "text-slate-700" : "text-white/80"}`}>
              <input
                type="checkbox"
                checked={postProcessing}
                onChange={(e) => setPostProcessing(e.target.checked)}
                className={isLight ? "rounded border-slate-300 text-[#E8440A]" : "rounded border-white/30 text-[#E8440A]"}
              />
              Post-processing / support removal
            </label>
          </div>
        </details>
      </div>

      {showEstimate && !onEstimateChange && (
        <div className={`mt-6 rounded-xl p-4 ${isLight ? "bg-[#E8440A]/10 text-[#E8440A] border border-[#E8440A]/30" : "bg-[#E8440A] text-white"}`}>
          <p className="text-sm font-medium opacity-90">Your Estimate</p>
          <p className="mt-1 text-2xl font-bold">
            {formatKes(priceLow)} – {formatKes(priceHigh)}
          </p>
          <p className="mt-0.5 text-xs opacity-90">(includes 16% VAT)</p>
        </div>
      )}

      <p className={`mt-4 text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>
        This is an estimate. Our team will confirm your final price within 2
        business days.
      </p>
    </div>
  );
}
