"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { use3DRates } from "@/hooks/use3DRates";
import { formatKes, type PrintJob, calculatePrintCost, type PrinterSettings, type MaterialRate } from "@/lib/3d-calculator-engine";
import {
  COLOUR_PILLS,
  BRAND_COLOUR_HEX,
  canonicalColorFromSpec,
  colorMatches,
  PREFERRED_MATERIAL_ORDER,
} from "@/lib/3d-colour-utils";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type MaterialWithColors = { code: string; name: string; color?: string; baseMaterial?: string; quantity?: number };
import { Calculator, History, FileText, Plus, Trash2, Box, RotateCcw } from "lucide-react";
import { setQuoteDraft } from "@/lib/quote-draft";
// Removed computeMultiPart3DEstimate import as we will use calculatePrintCost directly

type TabId = "calculator" | "history";
type PrinterOption = { id: string; name: string; source?: string; status?: string; nextScheduledMaintDate?: string | null };

type HistoryEntry = {
  id: string;
  jobName: string;
  parts: Array<{
    name: string;
    materialCode: string;
    weightGrams: number;
    printTimeHours: number;
    quantity: number;
    postProcessing: boolean;
    postProcessingTimeHoursOverride?: number;
    productionCost: number;
    sellingPrice: number;
  }>;
  totalProductionCost: number;
  totalSellingPrice: number;
  profitAmount: number;
  marginPercent: number;
  createdAt: string;
};

const MARGIN_PRESETS = [20, 30, 40, 50, 60];

export function AdminPrintCalculator() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | "">("");
  const { data: rates, loading: ratesLoading } = use3DRates(selectedPrinterId || undefined);
  const [tab, setTab] = useState<TabId>("calculator");
  const [printerOptions, setPrinterOptions] = useState<PrinterOption[]>([]);

  // Calculator tab state
  const [jobName, setJobName] = useState("");
  const [parts, setParts] = useState<Array<PrintJob & { materialName: string; costPerKg: number }>>([]);
  
  // Current part form state
  const [partName, setPartName] = useState("");
  const [colorChoice, setColorChoice] = useState("");
  const [weightGrams, setWeightGrams] = useState<number | "">("");
  const [printTimeHours, setPrintTimeHours] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [infillPercent, setInfillPercent] = useState<number | "">(20);
  const [layerHeightMm, setLayerHeightMm] = useState<number | "">(0.2);
  const [postProcessing, setPostProcessing] = useState(false);
  const [postProcessingHours, setPostProcessingHours] = useState<number | "">(0.5);
  
  const [marginOverride, setMarginOverride] = useState<number | "">("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // History tab state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  const materials: MaterialWithColors[] = useMemo(() => {
    if (!rates?.materials?.length) return [];
    return rates.materials.map((m) => ({
      code: m.code,
      name: m.name,
      baseMaterial: (m as any).baseMaterial ?? (m.name.replace(/\s*\([^)]*\)\s*$/, "").trim() || m.name),
      color: (m as any).color ?? canonicalColorFromSpec(m.name),
      quantity: (m as any).quantity ?? 1,
    }));
  }, [rates?.materials]);

  const { materialTypes, byMaterialType, availableColorSet, inStockColorSet } = useMemo(() => {
    const byBase: Record<string, { code: string; name: string; color: string; quantity: number }[]> = {};
    for (const m of materials) {
      const base = m.baseMaterial ?? (m.name.replace(/\s*\([^)]*\)\s*$/, "").trim() || m.name);
      if (!byBase[base]) byBase[base] = [];
      const rawColor = m.color ?? ((m.name.match(/\s*\(([^)]+)\)\s*$/) ?? [])[1]?.trim() ?? "");
      const canonical = canonicalColorFromSpec(rawColor);
      byBase[base].push({ code: m.code, name: m.name, color: canonical, quantity: m.quantity ?? 1 });
    }
    const types = Object.keys(byBase);
    const sorted = Array.from(new Set([...PREFERRED_MATERIAL_ORDER.filter((p) => types.some((t) => t.toLowerCase() === p.toLowerCase())), ...types]));
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

  const [materialType, setMaterialType] = useState("");
  const effectiveMaterial = useMemo(() => {
    if (!materialType || !byMaterialType[materialType]?.length) return materialTypes.length ? (byMaterialType[materialTypes[0]]?.[0]?.code ?? "") : "";
    const list = byMaterialType[materialType];
    const match = list.find((m) => colorMatches(m.color, colorChoice));
    return match ? match.code : list[0].code;
  }, [materialType, colorChoice, byMaterialType, materialTypes]);

  const availableColorsForType = useMemo(() => availableColorSet[materialType] ?? new Set<string>(), [materialType, availableColorSet]);
  const inStockForType = useMemo(() => inStockColorSet[materialType] ?? new Set<string>(), [materialType, inStockColorSet]);

  const effectiveMargin =
    marginOverride !== "" ? Number(marginOverride) : (rates?.printerSettings?.profitMarginPercent ?? 40);

  useEffect(() => {
    fetch("/api/admin/inventory/assets/printers?type=THREE_D")
      .then((r) => r.json())
      .then((data: { printers?: PrinterOption[]; threeDPrinters?: PrinterOption[] }) => {
        const list = data.printers ?? data.threeDPrinters ?? [];
        setPrinterOptions(Array.isArray(list) ? list : []);
        
        // AUTO-SELECT REAL HARDWARE:
        // If we have real inventory printers and haven't manually selected one yet, 
        // select the first real one instead of the 'Default' placeholder.
        if (Array.isArray(list) && list.length > 0) {
          if (!selectedPrinterId || selectedPrinterId === "") {
            setSelectedPrinterId(list[0].id);
          }
        }
      })
      .catch(() => setPrinterOptions([]));
  }, []); // Run on mount

  useEffect(() => {
    if (materialTypes.length && !materialType) {
      const first = materialTypes[0];
      setMaterialType(first);
      const inStock = inStockColorSet[first];
      const avail = availableColorSet[first];
      setColorChoice(inStock?.size ? Array.from(inStock)[0] : avail?.size ? Array.from(avail)[0] : "");
    }
  }, [materialTypes, materialType, availableColorSet, inStockColorSet]);

  useEffect(() => {
    if (materialType && availableColorsForType.size && colorChoice && !availableColorsForType.has(colorChoice)) {
      const first = byMaterialType[materialType]?.[0]?.color;
      setColorChoice(first ? (COLOUR_PILLS.find((p) => colorMatches(first, p.id))?.id ?? "") : COLOUR_PILLS[0]?.id ?? "");
    }
  }, [materialType, availableColorsForType, byMaterialType, colorChoice]);

  const handleAddPart = () => {
    if (!effectiveMaterial || !weightGrams || !printTimeHours) return;
    
    const mat = materials.find(m => m.code === effectiveMaterial);
    const selectedMaterial = rates?.materials?.find((m) => m.code === effectiveMaterial);

    setParts((prev) => [
      ...prev,
      {
        name: partName || `Part ${prev.length + 1}`,
        material: effectiveMaterial,
        materialName: mat?.name || effectiveMaterial,
        costPerKg: selectedMaterial?.costPerKgKes || 3500,
        weightGrams: Number(weightGrams) || 0,
        printTimeHours: Number(printTimeHours) || 0,
        postProcessing,
        postProcessingTimeHoursOverride: postProcessing && postProcessingHours !== "" ? Number(postProcessingHours) : undefined,
        quantity: Math.max(1, quantity),
        color: colorChoice, // Save the color selection
        infillPercent: Number(infillPercent) || 20,
        layerHeightMm: Number(layerHeightMm) || 0.2,
      },
    ]);
    
    // Reset part form
    setPartName("");
    setWeightGrams("");
    setPrintTimeHours("");
    setQuantity(1);
    setInfillPercent(20);
    setLayerHeightMm(0.2);
    setPostProcessing(false);
    setPostProcessingHours(0.5);
  };

  const handleRemovePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedMaterial = useMemo(
    () => rates?.materials?.find((m) => m.code === effectiveMaterial),
    [rates?.materials, effectiveMaterial]
  );

  const breakdown = useMemo(() => {
    if (!rates?.printerSettings || !rates.materials.length) return null;
    
    const activeParts = [...parts];
    
    if (activeParts.length === 0) {
      const w = Number(weightGrams) || 0;
      const t = Number(printTimeHours) || 0;
      if (w > 0 && t > 0 && selectedMaterial) {
        activeParts.push({
          name: partName || "Part 1",
          material: effectiveMaterial,
          materialName: selectedMaterial.name,
          costPerKg: selectedMaterial.costPerKgKes,
          weightGrams: w,
          printTimeHours: t,
          postProcessing,
          postProcessingTimeHoursOverride: postProcessing && postProcessingHours !== "" ? Number(postProcessingHours) : undefined,
          quantity: Math.max(1, quantity),
        });
      }
    }

    if (activeParts.length === 0) return null;
    
    const estimates = activeParts.map(p => {
      const job: PrintJob = {
        name: p.name,
        material: p.material,
        weightGrams: p.weightGrams,
        printTimeHours: p.printTimeHours,
        postProcessing: p.postProcessing,
        postProcessingTimeHoursOverride: p.postProcessingTimeHoursOverride,
        quantity: p.quantity,
      };
      return calculatePrintCost(
        job,
        { ...rates.printerSettings, profitMarginPercent: effectiveMargin },
        rates.materials
      );
    });

    const total = estimates.reduce((acc, est) => ({
      materialCost: acc.materialCost + est.materialCost,
      machineCost: acc.machineCost + (est.electricityCost + est.depreciationCost + est.maintenanceCost + est.overheadCost + est.failedPrintBuffer),
      labourCost: acc.labourCost + est.laborCost,
      postProcessingCost: acc.postProcessingCost + (est.perUnitSellingPrice - est.perUnitCost < 0 ? 0 : 0), // wait
      totalProductionCost: acc.totalProductionCost + est.totalProductionCost,
      profitAmount: acc.profitAmount + est.profitAmount,
      sellingPriceExVat: acc.sellingPriceExVat + est.sellingPriceExVat,
      vatAmount: acc.vatAmount + est.vatAmount,
      sellingPriceIncVat: acc.sellingPriceIncVat + est.sellingPriceIncVat,
    }), {
      materialCost: 0, machineCost: 0, labourCost: 0, postProcessingCost: 0, totalProductionCost: 0, profitAmount: 0, sellingPriceExVat: 0, vatAmount: 0, sellingPriceIncVat: 0
    });

    // Re-calculate postProcessingCost specifically for the breakdown view
    const totalPostProc = estimates.reduce((s, e) => {
        // In the granular engine, postProcessingFeePerUnit is added to totalProductionCostPerUnit
        // We'll estimate it here for visibility
        return s + (estimates[0].quantity * (rates.printerSettings.postProcessingFeePerUnit ?? 200));
    }, 0);

    const summary = {
      estimates,
      materialCost: estimates.reduce((s: any, e: any) => s + e.materialCost, 0),
      machineCost: estimates.reduce((s: any, e: any) => s + (e.electricityCost + e.depreciationCost + e.maintenanceCost), 0),
      electricityCost: estimates.reduce((s: any, e: any) => s + e.electricityCost, 0),
      labourCost: estimates.reduce((s: any, e: any) => s + e.laborCost, 0),
      postProcessingCost: estimates.reduce((s: any, e: any) => s + (e as any).postProcessingFeePerUnit * (e.quantity || 1), 0), 
      packagingCost: estimates.reduce((s: any, e: any) => s + e.packagingCost, 0),
      overheadCost: estimates.reduce((s: any, e: any) => s + e.overheadCost, 0),
      failedPrintBuffer: estimates.reduce((s: any, e: any) => s + e.failedPrintBuffer, 0),
      subtotal: estimates.reduce((s: any, e: any) => s + e.totalProductionCost, 0),
      profit: estimates.reduce((s: any, e: any) => s + e.profitAmount, 0),
      vat: estimates.reduce((s: any, e: any) => s + e.vatAmount, 0),
      vatPercent: rates.printerSettings.vatRatePercent,
      finalPrice: estimates.reduce((s: any, e: any) => s + e.sellingPriceIncVat, 0),
      rangeLow: estimates.reduce((s: any, e: any) => s + e.sellingPriceIncVat, 0) * 0.95,
      rangeHigh: estimates.reduce((s: any, e: any) => s + e.sellingPriceIncVat, 0) * 1.05,
    };

    return summary;
  }, [rates, parts, effectiveMargin, weightGrams, printTimeHours, quantity, postProcessing, postProcessingHours, selectedMaterial, effectiveMaterial]);

  const marginSensitivity = useMemo(() => {
    if (!breakdown || !rates) return null;
    const baseCost = breakdown.subtotal;
    return MARGIN_PRESETS.map((pct) => ({
      pct,
      selling: baseCost * (1 + pct / 100) * (1 + rates.printerSettings.vatRatePercent / 100),
    }));
  }, [breakdown, rates]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/calculator/3d/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);

  const handleSaveToHistory = async () => {
    if (!jobName.trim()) {
      setSaveStatus("error");
      return;
    }
    if (!breakdown) return;
    setSaveStatus("loading");
    try {
      const res = await fetch("/api/admin/calculator/3d/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobName: jobName.trim(),
          parts: parts.map((p, i) => ({
            name: p.name,
            materialCode: p.material,
            weightGrams: p.weightGrams,
            printTimeHours: p.printTimeHours,
            quantity: p.quantity,
            postProcessing: p.postProcessing,
            postProcessingTimeHoursOverride: p.postProcessingTimeHoursOverride,
            productionCost: breakdown.estimates[i].totalProductionCost,
            sellingPrice: breakdown.estimates[i].sellingPriceIncVat,
            color: p.color,
            infillPercent: p.infillPercent,
            layerHeightMm: p.layerHeightMm,
          })),
          totalProductionCost: breakdown.subtotal,
          profitAmount: breakdown.profit,
          vatAmount: breakdown.vat,
          totalSellingPrice: breakdown.finalPrice,
          marginPercent: effectiveMargin,
        }),
      });
      if (res.ok) {
        setSaveStatus("done");
        fetchHistory();
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  const filteredHistory = useMemo(() => {
    if (!historyFilter.trim()) return history;
    const q = historyFilter.toLowerCase();
    return history.filter(
      (e) =>
        e.jobName.toLowerCase().includes(q) ||
        e.parts?.some(p => p.materialCode.toLowerCase().includes(q))
    );
  }, [history, historyFilter]);

  const handleDeleteHistory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation from history?")) return;
    try {
      const res = await fetch(`/api/admin/calculator/3d/history?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Delete history error:", err);
    }
  };

  const handleLoadFromHistory = (entry: HistoryEntry) => {
    setJobName(entry.jobName);
    setMarginOverride(entry.marginPercent === rates?.printerSettings?.profitMarginPercent ? "" : entry.marginPercent);
    
    const loadedParts = (entry.parts || []).map(p => {
      const selectedMaterial = rates?.materials?.find((m) => m.code === p.materialCode);
      return {
        name: p.name,
        material: p.materialCode,
        materialName: selectedMaterial?.name || p.materialCode,
        costPerKg: selectedMaterial?.costPerKgKes || 3500,
        weightGrams: p.weightGrams,
        printTimeHours: p.printTimeHours,
        postProcessing: p.postProcessing,
        postProcessingTimeHoursOverride: p.postProcessingTimeHoursOverride,
        quantity: p.quantity,
        color: (p as any).color || "",
        infillPercent: (p as any).infillPercent ?? 20,
        layerHeightMm: (p as any).layerHeightMm ?? 0.2,
      };
    });
    
    setParts(loadedParts);
    setTab("calculator");
  };

  if (ratesLoading || !rates) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading calculator…
        </CardContent>
      </Card>
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof Calculator }[] = [
    { id: "calculator", label: "Calculator", icon: Calculator },
    { id: "history", label: "Print History", icon: History },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "calculator" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Print details</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Select printer from Inventory → Hardware. It drives cost and pricing.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Printer</Label>
                <select
                  value={selectedPrinterId}
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {printerOptions.length === 0 ? (
                    <option value="">Default (no inventory printer)</option>
                  ) : (
                    printerOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.source === "PrinterAsset" && p.status ? ` (${p.status})` : ""}
                        {p.nextScheduledMaintDate ? ` — Maint: ${new Date(p.nextScheduledMaintDate).toLocaleDateString()}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Project name</Label>
                  <Input
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="e.g. Mechanical Assembly"
                    className="mt-1"
                  />
                </div>
                <div className="w-32">
                  <Label>Global margin %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={marginOverride === "" ? "" : marginOverride}
                    onChange={(e) =>
                      setMarginOverride(
                        e.target.value === ""
                          ? ""
                          : Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                      )
                    }
                    placeholder={String(rates?.printerSettings?.profitMarginPercent ?? 40)}
                    className="mt-1"
                  />
                </div>
              </div>

              {parts.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Parts</Label>
                  <div className="space-y-2">
                    {parts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-sm">
                        <div className="flex items-center gap-3">
                          <Box className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.materialName} • {p.weightGrams}g • {p.printTimeHours}h • Qty: {p.quantity}
                              {p.postProcessing ? ` • Post-proc (${p.postProcessingTimeHoursOverride ?? 0.5}h)` : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemovePart(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Add New Part</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <div>
                  <Label>Part name</Label>
                  <Input
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="e.g. Outer Shell"
                    className="mt-1"
                  />
                </div>
              <div>
                <Label>Material</Label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {materialTypes.map((mt) => {
                    const list = byMaterialType[mt] ?? [];
                    const totalSpools = list.reduce((s, x) => s + x.quantity, 0);
                    return (
                      <option key={mt} value={mt}>
                        {mt}{list.length ? ` — ${totalSpools} spool${totalSpools !== 1 ? "s" : ""} in stock` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label>Colour</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLOUR_PILLS.map((pill) => {
                    const available = availableColorsForType.has(pill.id);
                    const inStock = inStockForType.has(pill.id);
                    const disabled = !available || !inStock;
                    const selected = colorChoice === pill.id;
                    const isWhite = pill.id === "White";
                    const stockItem = materialType ? (byMaterialType[materialType] ?? []).find((x) => colorMatches(x.color, pill.id)) : null;
                    const spools = stockItem?.quantity ?? 0;
                    const title = !available && materialType
                      ? `Not available in ${materialType}`
                      : !inStock && available
                        ? "Out of stock"
                        : available && materialType
                          ? `${pill.label} — ${spools} spool${spools !== 1 ? "s" : ""} in stock`
                          : pill.label;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        disabled={disabled}
                        title={title}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Weight (g)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={weightGrams === "" ? "" : weightGrams}
                    onChange={(e) =>
                      setWeightGrams(
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Print time (hrs)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={printTimeHours === "" ? "" : printTimeHours}
                    onChange={(e) =>
                      setPrintTimeHours(
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Infill %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={infillPercent === "" ? "" : infillPercent}
                    onChange={(e) =>
                      setInfillPercent(
                        e.target.value === ""
                          ? ""
                          : Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0))
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Layer height (mm)</Label>
                  <Input
                    type="number"
                    min={0.05}
                    max={1.0}
                    step={0.05}
                    value={layerHeightMm === "" ? "" : layerHeightMm}
                    onChange={(e) =>
                      setLayerHeightMm(
                        e.target.value === ""
                          ? ""
                          : Math.max(0.05, Math.min(1.0, parseFloat(e.target.value) || 0.2))
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
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
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postProcessing}
                        onChange={(e) => setPostProcessing(e.target.checked)}
                        className="rounded border-input"
                      />
                      <span className="text-sm">Post-processing</span>
                    </label>
                  </div>
                </div>

                {postProcessing && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label className="text-xs text-primary font-semibold uppercase tracking-wider">Post-processing adjustments (Staff Override)</Label>
                    <div className="mt-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                      <div>
                        <Label>Labor time (hrs)</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={postProcessingHours === "" ? "" : postProcessingHours}
                            onChange={(e) =>
                              setPostProcessingHours(
                                e.target.value === ""
                                  ? ""
                                  : Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="bg-background"
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            Default: 0.5 hrs
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Adjust based on part complexity (e.g., support removal difficulty).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddPart}
                    disabled={!effectiveMaterial || !weightGrams || !printTimeHours}
                    variant="secondary"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add part to project
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t flex gap-2">
                <Button
                  onClick={handleSaveToHistory}
                  disabled={parts.length === 0 || saveStatus === "loading"}
                >
                  {saveStatus === "loading"
                    ? "Saving…"
                    : saveStatus === "done"
                      ? "Saved"
                      : "Save project history"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost breakdown</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Rates from Finance → Business costs. Select printer from Inventory → Hardware for reference.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {!breakdown ? (
                <p className="text-sm text-muted-foreground">
                  Enter weight and print time to see breakdown.
                </p>
              ) : (
                <>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Materials</span>
                      <span>{formatKes(breakdown.materialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Machine & Electricity</span>
                      <span>{formatKes(breakdown.machineCost + (breakdown as any).electricityCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labour</span>
                      <span>{formatKes(breakdown.labourCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Packaging & Delivery Prep</span>
                      <span>{formatKes(breakdown.packagingCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Overhead & Failed print buffer</span>
                      <span>{formatKes(breakdown.overheadCost + breakdown.failedPrintBuffer)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-slate-900 border-dashed">
                      <span>SUBTOTAL (Internal Cost)</span>
                      <span>{formatKes(breakdown.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Net Profit ({effectiveMargin}%)</span>
                      <span>{formatKes(breakdown.profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({breakdown.vatPercent}%)</span>
                      <span>{formatKes(breakdown.vat)}</span>
                    </div>
                  </div>
                  <div className="border-t-2 pt-3 font-black flex justify-between text-orange-600 text-lg">
                    <span className="uppercase tracking-tight">Total Estimate</span>
                    <span>{formatKes(breakdown.finalPrice)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center mt-1">
                    ESTIMATED RANGE: {formatKes(breakdown.finalPrice * 0.95)} — {formatKes(breakdown.finalPrice * 1.05)}
                  </div>

                  {selectedPrinterId && printerOptions.find((p) => p.id === selectedPrinterId)?.source === "PrinterAsset" && (
                    <p className="pt-1">
                      <Link href={`/admin/inventory/hardware/printers/${selectedPrinterId}`} className="text-xs text-primary hover:underline">
                        View printer in inventory →
                      </Link>
                    </p>
                  )}
                  <Button
                    className="w-full mt-3"
                    onClick={() => {
                      const validUntil = new Date();
                      validUntil.setDate(validUntil.getDate() + 7);
                      setQuoteDraft({
                        type: "3d",
                        clientName: "",
                        validUntil: validUntil.toISOString().slice(0, 10),
                        lines: parts.map(p => ({
                          description: p.name,
                          materialCode: p.material,
                          color: p.color || "", // Now correctly passing the color
                          weightGrams: p.weightGrams,
                          printTimeHours: p.printTimeHours,
                          quantity: p.quantity,
                          postProcessing: p.postProcessing,
                          postProcessingTimeHoursOverride: p.postProcessingTimeHoursOverride,
                          marginPercentOverride: marginOverride !== "" ? Number(marginOverride) : undefined,
                          infillPercent: p.infillPercent,
                          layerHeightMm: p.layerHeightMm,
                        })),
                        globalMarginPercent: effectiveMargin,
                        discountType: "kes",
                        discountValue: 0,
                        discountReason: "",
                      });
                      window.location.href = "/admin/quotes/new?type=3d";
                    }}
                    disabled={!breakdown}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Send to quote builder → Generate PDF
                  </Button>
                  {marginSensitivity && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        What if margin changes?
                      </p>
                      <div className="space-y-1 text-xs">
                        {[20, 30, 40, 50, 60].map((pct) => {
                          // USE TRUE MARGIN FORMULA: Selling = Cost / (1 - Margin%)
                          const sellingExVat = breakdown.subtotal / (1 - pct / 100);
                          const totalIncVat = sellingExVat * (1 + breakdown.vatPercent / 100);
                          return (
                            <div
                              key={pct}
                              className={`flex justify-between ${pct === effectiveMargin ? "font-bold text-orange-600" : ""}`}
                            >
                              <span>{pct}% margin</span>
                              <span>{formatKes(totalIncVat)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Print history</CardTitle>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Search by job name or material…"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filteredHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Job / Parts</th>
                      <th className="text-right p-2 font-medium">Cost</th>
                      <th className="text-right p-2 font-medium">Profit</th>
                      <th className="text-right p-2 font-medium">Selling (Ex VAT)</th>
                      <th className="text-right p-2 font-medium">Margin %</th>
                      <th className="text-right p-2 font-medium text-primary">Total (Inc VAT)</th>
                      <th className="text-right p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-muted-foreground whitespace-nowrap">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{e.jobName}</div>
                          {e.parts && (
                            <div className="text-xs text-muted-foreground">
                              {e.parts.length} part{e.parts.length !== 1 ? "s" : ""}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {Math.round(e.totalProductionCost || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-green-600">
                          {Math.round(e.profitAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          {Math.round((e.totalSellingPrice || 0) / (1 + (rates?.printerSettings?.vatRatePercent || 16) / 100)).toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-medium">{e.marginPercent}%</td>
                        <td className="p-2 text-right font-bold text-primary">
                          {Math.round(e.totalSellingPrice || 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              title="Load as draft (edit)"
                              onClick={() => handleLoadFromHistory(e)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete history"
                              onClick={() => handleDeleteHistory(e.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
