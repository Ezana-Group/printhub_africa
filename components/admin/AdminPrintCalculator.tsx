"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalculatorConfig, compute3DEstimateFromConfig } from "@/hooks/useCalculatorConfig";
import { formatKes, type PrintJob } from "@/lib/3d-calculator-engine";
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
import { Calculator, History, FileText } from "lucide-react";
import { setQuoteDraft } from "@/lib/quote-draft";

type TabId = "calculator" | "history";
type PrinterOption = { id: string; name: string; source?: string; status?: string; nextScheduledMaintDate?: string | null };

type HistoryEntry = {
  id: string;
  jobName: string;
  materialCode: string;
  weightGrams: number;
  printTimeHours: number;
  quantity: number;
  postProcessing: boolean;
  productionCost: number;
  sellingPrice: number;
  profitAmount: number;
  marginPercent: number;
  createdAt: string;
};

const MARGIN_PRESETS = [20, 30, 40, 50, 60];

export function AdminPrintCalculator() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | "">("");
  const { data: config, loading: configLoading } = useCalculatorConfig();
  const [tab, setTab] = useState<TabId>("calculator");
  const [printerOptions, setPrinterOptions] = useState<PrinterOption[]>([]);

  // Calculator tab state
  const [jobName, setJobName] = useState("");
  const [colorChoice, setColorChoice] = useState("");
  const [weightGrams, setWeightGrams] = useState<number | "">("");
  const [printTimeHours, setPrintTimeHours] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [postProcessing, setPostProcessing] = useState(false);
  const [marginOverride, setMarginOverride] = useState<number | "">("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // History tab state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  const materials: MaterialWithColors[] = useMemo(() => {
    if (!config?.filaments?.length) return [];
    return config.filaments.map((f) => ({
      code: f.id,
      name: f.name,
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
    marginOverride !== "" ? Number(marginOverride) : (config?.profitMargin ?? 40);

  useEffect(() => {
    fetch("/api/admin/inventory/assets/printers?type=THREE_D")
      .then((r) => r.json())
      .then((data: { printers?: PrinterOption[]; threeDPrinters?: PrinterOption[] }) => {
        const list = data.printers ?? data.threeDPrinters ?? [];
        setPrinterOptions(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0 && !selectedPrinterId) {
          setSelectedPrinterId(list[0].id);
        }
      })
      .catch(() => setPrinterOptions([]));
  }, [selectedPrinterId]);

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

  const job: PrintJob = useMemo(
    () => ({
      name: jobName || "Job",
      material: effectiveMaterial,
      weightGrams: Number(weightGrams) || 0,
      printTimeHours: Number(printTimeHours) || 0,
      postProcessing,
      quantity: Math.max(1, Math.min(999, quantity)),
    }),
    [jobName, effectiveMaterial, weightGrams, printTimeHours, postProcessing, quantity]
  );

  const selectedFilament = useMemo(
    () => config?.filaments?.find((f) => f.id === effectiveMaterial),
    [config?.filaments, effectiveMaterial]
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
      costPerKg: selectedFilament.costPerKg,
      profitMarginOverride: effectiveMargin,
      postProcessing,
    });
  }, [config, selectedFilament, weightGrams, printTimeHours, quantity, effectiveMargin, postProcessing]);

  const marginSensitivity = useMemo(() => {
    if (!breakdown || !config) return null;
    const baseCost = breakdown.subtotal;
    return MARGIN_PRESETS.map((pct) => ({
      pct,
      selling: baseCost * (1 + pct / 100) * (1 + config.vatPercent / 100),
    }));
  }, [breakdown, config]);

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
          materialCode: job.material,
          weightGrams: job.weightGrams,
          printTimeHours: job.printTimeHours,
          quantity: job.quantity,
          postProcessing: job.postProcessing,
          productionCost: breakdown.subtotal,
          sellingPrice: breakdown.finalPrice,
          profitAmount: breakdown.profit,
          marginPercent: breakdown.profitMarginPct,
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
        e.materialCode.toLowerCase().includes(q)
    );
  }, [history, historyFilter]);

  if (configLoading || !config) {
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
              <div>
                <Label>Job name</Label>
                <Input
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g. Phone stand"
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
                  className="mt-1 w-24"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={postProcessing}
                  onChange={(e) => setPostProcessing(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm">Post-processing</span>
              </label>
              <div>
                <Label>Profit margin % (override)</Label>
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
                  placeholder={String(config?.profitMargin ?? 40)}
                  className="mt-1 w-24"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToHistory}
                  disabled={!breakdown || saveStatus === "loading"}
                >
                  {saveStatus === "loading"
                    ? "Saving…"
                    : saveStatus === "done"
                      ? "Saved"
                      : "Save to history"}
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
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Material cost</span>
                      <span>{formatKes(breakdown.materialCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Machine cost</span>
                      <span>{formatKes(breakdown.machineCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labour cost</span>
                      <span>{formatKes(breakdown.labourCost)}</span>
                    </div>
                    {breakdown.postProcessingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Post-processing / support removal</span>
                        <span>{formatKes(breakdown.postProcessingCost)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span>{formatKes(breakdown.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Profit ({breakdown.profitMarginPct}%)</span>
                      <span>{formatKes(breakdown.profit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({breakdown.vatPercent}%)</span>
                      <span>{formatKes(breakdown.vat)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3 font-bold flex justify-between text-primary">
                    <span>Total estimate</span>
                    <span>{formatKes(breakdown.rangeLow)} — {formatKes(breakdown.rangeHigh)}</span>
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
                        lines: [
                          {
                            description: jobName.trim() || "Item",
                            materialCode: effectiveMaterial,
                            color: colorChoice || "",
                            weightGrams: Number(weightGrams) || 0,
                            printTimeHours: Number(printTimeHours) || 0,
                            quantity: Math.max(1, quantity),
                            postProcessing,
                            marginPercentOverride: marginOverride !== "" ? Number(marginOverride) : undefined,
                          },
                        ],
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
                        {marginSensitivity.map(({ pct, selling }) => (
                          <div
                            key={pct}
                            className={`flex justify-between ${pct === effectiveMargin ? "font-medium text-primary" : ""}`}
                          >
                            <span>{pct}% margin</span>
                            <span>{formatKes(selling)}</span>
                          </div>
                        ))}
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
                      <th className="text-left p-2 font-medium">Job</th>
                      <th className="text-left p-2 font-medium">Material</th>
                      <th className="text-right p-2 font-medium">Weight</th>
                      <th className="text-right p-2 font-medium">Time</th>
                      <th className="text-right p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Cost</th>
                      <th className="text-right p-2 font-medium">Selling</th>
                      <th className="text-right p-2 font-medium">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-muted-foreground">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-2">{e.jobName}</td>
                        <td className="p-2">{e.materialCode}</td>
                        <td className="p-2 text-right">{e.weightGrams}g</td>
                        <td className="p-2 text-right">{e.printTimeHours}h</td>
                        <td className="p-2 text-right">{e.quantity}</td>
                        <td className="p-2 text-right">
                          {Math.round(e.productionCost).toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          {Math.round(e.sellingPrice).toLocaleString()}
                        </td>
                        <td className="p-2 text-right">{e.marginPercent}%</td>
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
