"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Calculator, Package, History, Download, FileText } from "lucide-react";
import { setQuoteDraft } from "@/lib/quote-draft";
import type { LFHistoryEntry } from "@/app/api/admin/calculator/lf/history/route";

type TabId = "calculator" | "inventory-costs" | "history";

type LFPrinterOption = { id: string; name: string; source?: string; status?: string; nextScheduledMaintDate?: string | null };

const MARGIN_PRESETS = [20, 30, 40, 50, 60];

function formatKes(n: number) {
  return `KES ${Math.round(n).toLocaleString()}`;
}

export function AdminLFCalculator() {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | "">("");
  const { data: rates, loading: ratesLoading, refetch } = useLFRates(selectedPrinterId || undefined);
  const [tab, setTab] = useState<TabId>("calculator");
  const [lfPrinters, setLfPrinters] = useState<LFPrinterOption[]>([]);

  const [widthCm, setWidthCm] = useState("200");
  const [heightCm, setHeightCm] = useState("100");
  const [materialCode, setMaterialCode] = useState("");
  const [quantity, setQuantity] = useState(3);
  const [laminationCode, setLaminationCode] = useState("NONE");
  const [finishingEyelets, setFinishingEyelets] = useState<"NONE" | "STANDARD" | "HEAVY">("STANDARD");
  const [finishingHemming, setFinishingHemming] = useState<"NONE" | "ALL_4" | "TOP_BOTTOM">("ALL_4");
  const [finishingRope, setFinishingRope] = useState(false);
  const [designFeeKes, setDesignFeeKes] = useState(0);
  const [rushMultiplier, setRushMultiplier] = useState(1);
  const [marginOverride, setMarginOverride] = useState<number | "">(40);
  const [jobName, setJobName] = useState("");
  const [saveHistoryStatus, setSaveHistoryStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const [history, setHistory] = useState<LFHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  const materials = useMemo(() => rates?.materials ?? [], [rates?.materials]);
  const laminations = useMemo(() => rates?.laminations ?? [], [rates?.laminations]);

  useEffect(() => {
    if (materials.length && !materialCode) setMaterialCode(materials[0].code);
  }, [materials, materialCode]);

  const w = Number(widthCm) || 0;
  const h = Number(heightCm) || 0;
  const widthM = w / 100;
  const heightM = h / 100;
  const area = widthM * heightM;
  const mat = materials.find((m) => m.code === materialCode) ?? materials[0];
  const lam = laminations.find((l) => l.code === laminationCode);

  const job: LFJobInputs = useMemo(
    () => ({
      widthM,
      heightM,
      quantity,
      materialCode: mat?.code ?? "",
      laminationCode: laminationCode === "NONE" ? "NONE" : (lam?.code ?? "NONE"),
      finishing: {
        eyelets: finishingEyelets,
        hemming: finishingHemming,
        polePockets: "NONE",
        rope: finishingRope,
      },
      printType: "CMYK",
      designFeeKes,
      rushMultiplier,
    }),
    [
      widthM,
      heightM,
      quantity,
      mat?.code,
      laminationCode,
      lam?.code,
      finishingEyelets,
      finishingHemming,
      finishingRope,
      designFeeKes,
      rushMultiplier,
    ]
  );

  const effectiveMargin =
    marginOverride !== "" ? Number(marginOverride) : (rates?.businessSettings?.defaultProfitMarginPct ?? 40);

  const materialCosts: LFMaterialCosts | null = useMemo(() => {
    if (!rates || !mat) return null;
    return {
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
  }, [rates, mat, lam]);

  const breakdown = useMemo(() => {
    if (!rates || !materialCosts || !widthM || !heightM || !mat) return null;
    const businessWithMargin = {
      ...rates.businessSettings,
      defaultProfitMarginPct: effectiveMargin,
    };
    return calculateLFPrintCost(
      job,
      rates.printerSettings,
      businessWithMargin,
      materialCosts
    );
  }, [rates, job, materialCosts, effectiveMargin, widthM, heightM, mat]);

  const marginSensitivity = useMemo(() => {
    if (!breakdown) return null;
    const baseBeforeProfit =
      breakdown.totalProductionCost + breakdown.rushSurcharge + breakdown.designFee;
    return MARGIN_PRESETS.map((pct) => {
      const subtotal = baseBeforeProfit * (1 + pct / 100);
      const vat = subtotal * ((rates?.businessSettings?.vatRatePct ?? 16) / 100);
      return { pct, selling: roundLFToNearest10(subtotal + vat) };
    });
  }, [breakdown, rates?.businessSettings?.vatRatePct]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/calculator/lf/history");
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

  useEffect(() => {
    fetch("/api/admin/inventory/assets/printers?type=LARGE_FORMAT")
      .then((r) => r.json())
      .then((data: { printers?: LFPrinterOption[]; largeFormatPrinters?: LFPrinterOption[] }) => {
        const list = data.printers ?? data.largeFormatPrinters ?? [];
        setLfPrinters(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0 && !selectedPrinterId) {
          setSelectedPrinterId(list[0].id);
        }
      })
      .catch(() => setLfPrinters([]));
  }, [selectedPrinterId]);

  const handleSaveToHistory = async () => {
    if (!breakdown || !mat) return;
    setSaveHistoryStatus("loading");
    try {
      const res = await fetch("/api/admin/calculator/lf/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobName: jobName.trim() || `${widthCm}x${heightCm}cm ${mat.name}`,
          widthM: job.widthM,
          heightM: job.heightM,
          quantity: job.quantity,
          materialCode: mat.code,
          materialName: mat.name,
          laminationCode: job.laminationCode,
          productionCost: breakdown.totalProductionCost,
          sellingPrice: breakdown.totalIncVat,
          profitAmount: breakdown.profitAmount,
          marginPercent: breakdown.profitMarginPct,
          totalJobTimeHours: breakdown.totalJobTimeHours,
        }),
      });
      if (res.ok) {
        setSaveHistoryStatus("done");
        fetchHistory();
      } else {
        setSaveHistoryStatus("error");
      }
    } catch {
      setSaveHistoryStatus("error");
    }
  };

  const exportHistoryCsv = () => {
    const headers = ["Date", "Job", "Width (m)", "Height (m)", "Qty", "Material", "Production cost", "Selling price", "Profit", "Margin %", "Time (hrs)"];
    const rows = history.map((e) => [
      e.createdAt,
      e.jobName,
      e.widthM,
      e.heightM,
      e.quantity,
      e.materialCode,
      e.productionCost,
      e.sellingPrice,
      e.profitAmount,
      e.marginPercent,
      e.totalJobTimeHours,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lf-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = useMemo(() => {
    if (!historyFilter.trim()) return history;
    const q = historyFilter.toLowerCase();
    return history.filter(
      (e) =>
        (e.jobName || "").toLowerCase().includes(q) ||
        (e.materialCode || "").toLowerCase().includes(q)
    );
  }, [history, historyFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("calculator")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "calculator"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calculator className="inline h-4 w-4 mr-1.5" />
          Calculator
        </button>
        <button
          type="button"
          onClick={() => setTab("inventory-costs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "inventory-costs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="inline h-4 w-4 mr-1.5" />
          Inventory costs
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="inline h-4 w-4 mr-1.5" />
          Job history
        </button>
      </div>

      {tab === "calculator" && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
            <CardTitle className="text-lg">Job details</CardTitle>
            <CardDescription>
              Dimensions, material, finishing. Select printer from Inventory → Hardware. Business costs (rent, labour, VAT, profit) are set in{" "}
              <Link href="/admin/finance" className="text-primary hover:underline">Admin → Finance → Business costs</Link>.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratesLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!ratesLoading && rates && (
                <>
                  <div>
                    <Label>Printer</Label>
                    <select
                      value={selectedPrinterId}
                      onChange={(e) => setSelectedPrinterId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {lfPrinters.length === 0 ? (
                        <option value="">Default (no inventory printer)</option>
                      ) : (
                        lfPrinters.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.source === "PrinterAsset" && p.status ? ` (${p.status})` : ""}
                            {p.nextScheduledMaintDate ? ` — Maint: ${new Date(p.nextScheduledMaintDate).toLocaleDateString()}` : ""}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add large format printers in Admin → Inventory → Hardware.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={widthCm}
                        onChange={(e) => setWidthCm(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Height (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {area > 0 && (
                    <p className="text-xs text-muted-foreground">Area: {area.toFixed(2)} m²</p>
                  )}
                  <div>
                    <Label>Material</Label>
                    <select
                      value={materialCode}
                      onChange={(e) => setMaterialCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {materials.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.name} {m.isLowStock ? "(low stock)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={999}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Lamination</Label>
                    <select
                      value={laminationCode}
                      onChange={(e) => setLaminationCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="NONE">None</option>
                      {laminations.filter((l) => l.code !== "NONE").map((l) => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Eyelets</Label>
                      <select
                        value={finishingEyelets}
                        onChange={(e) =>
                          setFinishingEyelets(e.target.value as "NONE" | "STANDARD" | "HEAVY")
                        }
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="NONE">None</option>
                        <option value="STANDARD">Standard</option>
                        <option value="HEAVY">Heavy duty</option>
                      </select>
                    </div>
                    <div>
                      <Label>Hemming</Label>
                      <select
                        value={finishingHemming}
                        onChange={(e) =>
                          setFinishingHemming(e.target.value as "NONE" | "ALL_4" | "TOP_BOTTOM")
                        }
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="NONE">None</option>
                        <option value="ALL_4">All 4 sides</option>
                        <option value="TOP_BOTTOM">Top & bottom</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={finishingRope}
                      onChange={(e) => setFinishingRope(e.target.checked)}
                      className="rounded"
                    />
                    Rope / bungee
                  </label>
                  <div>
                    <Label>Design fee (KES)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={designFeeKes}
                      onChange={(e) => setDesignFeeKes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="mt-1"
                    />
                  </div>
                  {rates.rushOptions?.length > 0 && (
                    <div>
                      <Label>Rush</Label>
                      <select
                        value={rushMultiplier}
                        onChange={(e) => setRushMultiplier(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {rates.rushOptions.map((r) => (
                          <option key={r.code} value={r.multiplier}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label>Profit margin % (override)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={marginOverride === "" ? "" : marginOverride}
                      onChange={(e) =>
                        setMarginOverride(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="mt-1 w-24"
                    />
                  </div>
                  <div>
                    <Label>Job name (for history)</Label>
                    <Input
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="e.g. Banner order XYZ"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSaveToHistory}
                    disabled={!breakdown || saveHistoryStatus === "loading"}
                  >
                    {saveHistoryStatus === "loading"
                      ? "Saving…"
                      : saveHistoryStatus === "done"
                        ? "Saved"
                        : "Save to history"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full cost breakdown</CardTitle>
              <CardDescription>Real costs from inventory + profit + VAT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!breakdown && !ratesLoading && (
                <p className="text-muted-foreground">Enter dimensions and material to see breakdown.</p>
              )}
              {breakdown && (
                <>
                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground">Direct material costs</p>
                    <p>Substrate: {formatKes(breakdown.substrateMaterialCost)}</p>
                    <p>Ink: {formatKes(breakdown.inkCost)}</p>
                    <p>Lamination: {formatKes(breakdown.laminationMaterialCost)}</p>
                    <p>Finishing hardware: {formatKes(breakdown.finishingHardwareCost)}</p>
                    <p className="font-medium">Total materials: {formatKes(breakdown.totalDirectMaterialCost)}</p>
                  </div>
                  <div className="space-y-1 border-t pt-2">
                    <p>Labour: {formatKes(breakdown.labourCost)}</p>
                    <p className="flex items-center gap-2">
                      Machine: {formatKes(breakdown.machineCost)}
                      {selectedPrinterId && lfPrinters.find((p) => p.id === selectedPrinterId)?.source === "PrinterAsset" && (
                        <Link href={`/admin/inventory/hardware/printers/${selectedPrinterId}`} className="text-xs text-primary hover:underline">
                          View printer →
                        </Link>
                      )}
                    </p>
                    <p>Overhead: {formatKes(breakdown.overheadCost)}</p>
                    <p>Wastage buffer: {formatKes(breakdown.wastageBuffer)}</p>
                    <p>Packaging: {formatKes(breakdown.packagingCost)}</p>
                    <p className="font-medium">Total production cost: {formatKes(breakdown.totalProductionCost)}</p>
                  </div>
                  <div className="space-y-1 border-t pt-2">
                    <p>Rush surcharge: {formatKes(breakdown.rushSurcharge)}</p>
                    <p>Design fee: {formatKes(breakdown.designFee)}</p>
                    <p>Profit ({breakdown.profitMarginPct}%): {formatKes(breakdown.profitAmount)}</p>
                    <p>Subtotal ex-VAT: {formatKes(breakdown.subtotalExVat)}</p>
                    <p>VAT: {formatKes(breakdown.vatAmount)}</p>
                    <p className="text-lg font-bold border-t pt-2">
                      Selling price (inc VAT): {formatKes(breakdown.totalIncVat)}
                    </p>
                  </div>
                  <Button
                    className="w-full mt-3"
                    onClick={() => {
                      const validUntil = new Date();
                      validUntil.setDate(validUntil.getDate() + 7);
                      setQuoteDraft({
                        type: "large_format",
                        clientName: "",
                        validUntil: validUntil.toISOString().slice(0, 10),
                        lines: [
                          {
                            description: jobName.trim() || `${widthCm}×${heightCm} cm`,
                            widthCm: w || 100,
                            heightCm: h || 100,
                            materialCode: mat?.code ?? "",
                            laminationCode: laminationCode === "NONE" ? "NONE" : laminationCode,
                            quantity: quantity,
                            eyelets: finishingEyelets,
                            hemming: finishingHemming,
                            marginPercentOverride: marginOverride !== "" ? Number(marginOverride) : undefined,
                          },
                        ],
                        globalMarginPercent: marginOverride !== "" ? Number(marginOverride) : 40,
                        discountKes: 0,
                      });
                      window.location.href = "/admin/quotes/new?type=large_format";
                    }}
                    disabled={!breakdown}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Send to quote builder → Generate PDF
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Break-even: {formatKes(breakdown.breakEvenPrice)} · Job time:{" "}
                    {breakdown.totalJobTimeHours.toFixed(2)} hrs · Profit/sqm:{" "}
                    {formatKes(breakdown.contributionMarginKes)}/m²
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Materials to deduct: Substrate {breakdown.substrateMetresRequired.toFixed(1)} lm,
                    Lam {breakdown.laminationMetresRequired.toFixed(1)} lm, Eyelets {breakdown.eyeletsRequired},
                    Hem tape {breakdown.hemTapeMetresRequired.toFixed(1)} m
                  </p>
                  {marginSensitivity && (
                    <div className="border-t pt-2">
                      <p className="font-medium text-muted-foreground mb-1">Margin sensitivity</p>
                      <div className="flex flex-wrap gap-2">
                        {marginSensitivity.map(({ pct, selling }) => (
                          <span key={pct} className="text-xs">
                            {pct}% → {formatKes(selling)}
                          </span>
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

      {tab === "inventory-costs" && (
        <Card>
          <CardHeader>
            <CardTitle>Current material costs (from inventory)</CardTitle>
            <CardDescription>
              These rates feed the calculator. Substrate rolls come from Large Format stock in Admin → Inventory. Ink and finishing use your inventory when set; otherwise the app shows default placeholders so quotes can still be generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ratesLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!ratesLoading && rates && (() => {
              const sources = (rates as { costSources?: { inkCosts?: string; finishing?: Record<string, boolean> } }).costSources;
              const inkDefault = sources?.inkCosts === "default";
              const finishingAllDefault = sources?.finishing && !Object.values(sources.finishing).some(Boolean);
              const showPlaceholderBanner = inkDefault || finishingAllDefault;
              return (
              <div className="space-y-6">
                {showPlaceholderBanner && (
                  <p className="text-sm rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30 px-3 py-2">
                    You haven’t added ink or finishing inventory yet. The ink and finishing costs below are <strong>default placeholders</strong> so the calculator can still run. To use your own costs: set printer ink in Admin → Finance (LF printer settings) or Inventory → Hardware, and add finishing items (eyelets, hem tape, rope, packaging) under Inventory → Large Format stock.
                  </p>
                )}
                <div>
                  <h4 className="font-medium mb-2">Substrate rolls</h4>
                  {rates.materials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No substrate rolls in inventory yet. Add Large Format stock in Admin → Inventory.</p>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {rates.materials.map((m) => (
                        <li key={m.code}>
                          {m.name} — {formatKes(m.averageCostKes)}/lm
                          {m.lastPurchasePriceKes != null &&
                            ` (last: ${formatKes(m.lastPurchasePriceKes)})`}
                          {m.stockAvailableLm > 0 && ` · Stock: ${m.stockAvailableLm} lm`}
                          {m.isLowStock && " · Low stock"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    Ink costs (per m²)
                    {inkDefault && (
                      <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">(default placeholder)</span>
                    )}
                  </h4>
                  <p className="text-sm">
                    CMYK: {formatKes(rates.inkCosts.CMYK)} · Photo: {formatKes(rates.inkCosts.PHOTO)} ·
                    Black only: {formatKes(rates.inkCosts.BLACK_ONLY)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    Finishing hardware
                    {finishingAllDefault && (
                      <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">(default placeholders)</span>
                    )}
                  </h4>
                  <p className="text-sm">
                    Eyelet: {formatKes(rates.finishingHardware.eyeletCostPerUnit)}/unit · Hem tape:{" "}
                    {formatKes(rates.finishingHardware.hemTapeCostPerM)}/m · Rope:{" "}
                    {formatKes(rates.finishingHardware.ropeCostPerM)}/m · Packaging:{" "}
                    {formatKes(rates.finishingHardware.packagingCostKes)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {tab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Job history</CardTitle>
            <CardDescription>
              All LF jobs calculated and saved. Export to CSV for reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Input
                placeholder="Search job or material…"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={exportHistoryCsv} disabled={history.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
            {historyLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!historyLoading && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Job</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Material</th>
                      <th className="text-right p-2">Cost</th>
                      <th className="text-right p-2">Selling</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((e) => (
                      <tr key={e.id} className="border-b">
                        <td className="p-2 text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">{e.jobName}</td>
                        <td className="p-2">{e.widthM}×{e.heightM}m</td>
                        <td className="p-2">{e.quantity}</td>
                        <td className="p-2">{e.materialCode}</td>
                        <td className="p-2 text-right">{formatKes(e.productionCost)}</td>
                        <td className="p-2 text-right">{formatKes(e.sellingPrice)}</td>
                        <td className="p-2 text-right text-green-600">{formatKes(e.profitAmount)}</td>
                        <td className="p-2 text-right">{e.marginPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredHistory.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground">No history yet. Use the Calculator tab and &quot;Save to history&quot;.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
