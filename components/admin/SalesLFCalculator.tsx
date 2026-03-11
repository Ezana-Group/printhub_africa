"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLFRates } from "@/hooks/useLFRates";
import {
  calculateLFPrintCost,
  type LFJobInputs,
  type LFMaterialCosts,
} from "@/lib/lf-calculator-engine";
import { Plus, Trash2, Copy, FileText, Send } from "lucide-react";
import type { QuoteDraftLF } from "@/lib/quote-draft";
import { clearQuoteDraft } from "@/lib/quote-draft";

const MAX_LINE_ITEMS = 20;
const DEFAULT_WA = "254700000000";

type LFLineItem = {
  id: string;
  description: string;
  widthCm: number;
  heightCm: number;
  materialCode: string;
  laminationCode: string;
  quantity: number;
  eyelets: "NONE" | "STANDARD" | "HEAVY";
  hemming: "NONE" | "ALL_4" | "TOP_BOTTOM";
  marginPercentOverride?: number;
};

function newLFLineItem(): LFLineItem {
  return {
    id: `lf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    widthCm: 100,
    heightCm: 100,
    materialCode: "",
    laminationCode: "NONE",
    quantity: 1,
    eyelets: "NONE",
    hemming: "NONE",
  };
}

function formatKes(n: number) {
  return `KES ${Math.round(n).toLocaleString()}`;
}

export function SalesLFCalculator({
  initialDraft,
}: {
  initialDraft?: QuoteDraftLF;
} = {}) {
  const { data: rates, loading: ratesLoading } = useLFRates();
  const [lines, setLines] = useState<LFLineItem[]>(() => [newLFLineItem()]);
  const [globalMarginPercent, setGlobalMarginPercent] = useState(40);
  const [overridePerLine, setOverridePerLine] = useState(false);
  const [discountKes, setDiscountKes] = useState<number | "">("");
  const [clientName, setClientName] = useState("");
  const [whatsappDigits, setWhatsappDigits] = useState(DEFAULT_WA);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!initialDraft || initialDraft.type !== "large_format") return;
    const d = initialDraft;
    setClientName(d.clientName);
    setValidUntil(d.validUntil);
    setGlobalMarginPercent(d.globalMarginPercent);
    setDiscountKes(d.discountKes);
    setLines(
      d.lines.length > 0
        ? d.lines.map((l, i) => ({
            id: `lf_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`,
            description: l.description,
            widthCm: l.widthCm,
            heightCm: l.heightCm,
            materialCode: l.materialCode,
            laminationCode: l.laminationCode,
            quantity: l.quantity,
            eyelets: l.eyelets,
            hemming: l.hemming,
            marginPercentOverride: l.marginPercentOverride,
          }))
        : [newLFLineItem()]
    );
    clearQuoteDraft();
  }, [initialDraft]);

  const materials = useMemo(() => rates?.materials ?? [], [rates?.materials]);
  const laminations = useMemo(() => rates?.laminations ?? [], [rates?.laminations]);

  useEffect(() => {
    fetch("/api/settings/business-public")
      .then((r) => r.json())
      .then((d) => {
        const wa = (d?.whatsapp ?? "").replace(/\D/g, "");
        if (wa) setWhatsappDigits(wa);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (materials.length && lines.length > 0 && !lines[0].materialCode) {
      setLines((prev) =>
        prev.map((l, i) => (i === 0 ? { ...l, materialCode: materials[0].code } : l))
      );
    }
  }, [materials, lines]);

  const lineResults = useMemo(() => {
    if (!rates || !materials.length) return [];
    return lines.map((line) => {
      const margin =
        overridePerLine && line.marginPercentOverride != null
          ? line.marginPercentOverride
          : globalMarginPercent;
      const w = line.widthCm / 100;
      const h = line.heightCm / 100;
      const mat = materials.find((m) => m.code === line.materialCode) ?? materials[0];
      const lam = laminations.find((l) => l.code === line.laminationCode);
      const job: LFJobInputs = {
        widthM: w,
        heightM: h,
        quantity: line.quantity,
        materialCode: mat?.code ?? "",
        laminationCode: line.laminationCode === "NONE" ? "NONE" : (lam?.code ?? "NONE"),
        finishing: {
          eyelets: line.eyelets,
          hemming: line.hemming,
          polePockets: "NONE",
          rope: false,
        },
        printType: "CMYK",
        designFeeKes: 0,
        rushMultiplier: 1,
      };
      const materialCosts: LFMaterialCosts = {
        substrateCode: mat?.code ?? "",
        substrateCostPerLm: mat?.averageCostKes ?? 0,
        substrateRollWidthM: mat?.rollWidthM ?? 1.52,
        laminationCode: lam?.code ?? null,
        laminationCostPerLm: lam?.averageCostKes ?? 0,
        inkCostPerSqm: rates.inkCosts.CMYK,
        eyeletCostPerUnit: rates.finishingHardware.eyeletCostPerUnit,
        hemTapeCostPerM: rates.finishingHardware.hemTapeCostPerM,
        ropeCostPerM: rates.finishingHardware.ropeCostPerM,
        polePocketCostPerM: rates.finishingHardware.polePocketCostPerM,
        packagingCostKes: rates.finishingHardware.packagingCostKes,
      };
      const businessWithMargin = {
        ...rates.businessSettings,
        defaultProfitMarginPct: margin,
      };
      try {
        const b = calculateLFPrintCost(
          job,
          rates.printerSettings,
          businessWithMargin,
          materialCosts
        );
        return {
          lineId: line.id,
          unitPrice: b.perUnitSellingPrice,
          lineTotal: b.totalIncVat,
          productionCost: b.totalProductionCost,
          marginPercent: margin,
          lowMargin: margin < 25,
        };
      } catch {
        return {
          lineId: line.id,
          unitPrice: 0,
          lineTotal: 0,
          productionCost: 0,
          marginPercent: margin,
          lowMargin: false,
        };
      }
    });
  }, [lines, rates, materials, laminations, globalMarginPercent, overridePerLine]);

  const subtotalIncVat = lineResults.reduce((s, r) => s + r.lineTotal, 0);
  const discount = Number(discountKes) || 0;
  const finalTotal = Math.max(0, subtotalIncVat - discount);
  const totalProductionCost = lineResults.reduce((s, r) => s + r.productionCost, 0);
  const totalProfit = finalTotal - totalProductionCost;
  const belowBreakEven = discount > 0 && finalTotal < totalProductionCost;

  const addLine = () => {
    if (lines.length >= MAX_LINE_ITEMS) return;
    setLines((prev) => [
      ...prev,
      { ...newLFLineItem(), materialCode: materials[0]?.code ?? "" },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, updates: Partial<LFLineItem>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const duplicateLine = (id: string) => {
    if (lines.length >= MAX_LINE_ITEMS) return;
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    setLines((prev) => [...prev, { ...line, id: newLFLineItem().id }]);
  };

  if (ratesLoading || !rates) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-xl font-bold">Large format quote builder</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Customer</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              className="w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Valid until</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Line items
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              disabled={lines.length >= MAX_LINE_ITEMS}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={overridePerLine}
                onChange={(e) => setOverridePerLine(e.target.checked)}
                className="rounded"
              />
              Override margin per line
            </label>
            {!overridePerLine && (
              <div className="flex items-center gap-2">
                <Label>Global margin %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={globalMarginPercent}
                  onChange={(e) =>
                    setGlobalMarginPercent(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))
                  }
                  className="w-20"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-8">#</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-right p-2 w-16">W (cm)</th>
                  <th className="text-right p-2 w-16">H (cm)</th>
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2 w-24">Lam</th>
                  <th className="text-right p-2 w-12">Qty</th>
                  <th className="text-left p-2 w-20">Finish</th>
                  {overridePerLine && (
                    <th className="text-right p-2 w-16">Margin %</th>
                  )}
                  <th className="text-right p-2">Unit</th>
                  <th className="text-right p-2">Total</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const result = lineResults.find((r) => r.lineId === line.id);
                  return (
                    <tr
                      key={line.id}
                      className={`border-b hover:bg-muted/30 ${result?.lowMargin ? "bg-amber-50" : ""}`}
                    >
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        <Input
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                          placeholder="e.g. Banner A"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.widthCm || ""}
                          onChange={(e) =>
                            updateLine(line.id, {
                              widthCm: Math.max(1, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="h-8 w-16 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.heightCm || ""}
                          onChange={(e) =>
                            updateLine(line.id, {
                              heightCm: Math.max(1, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className="h-8 w-16 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={line.materialCode}
                          onChange={(e) =>
                            updateLine(line.id, { materialCode: e.target.value })
                          }
                          className="h-8 w-full rounded border bg-background text-sm min-w-[120px]"
                        >
                          {materials.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={line.laminationCode}
                          onChange={(e) =>
                            updateLine(line.id, { laminationCode: e.target.value })
                          }
                          className="h-8 w-full rounded border bg-background text-sm"
                        >
                          <option value="NONE">None</option>
                          {laminations
                            .filter((l) => l.code !== "NONE")
                            .map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, {
                              quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="h-8 w-12 text-right text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col gap-1">
                          <select
                            value={line.eyelets}
                            onChange={(e) =>
                              updateLine(line.id, {
                                eyelets: e.target.value as "NONE" | "STANDARD" | "HEAVY",
                              })
                            }
                            className="h-7 w-full rounded border bg-background text-xs"
                          >
                            <option value="NONE">No eyelets</option>
                            <option value="STANDARD">Eyelets std</option>
                            <option value="HEAVY">Eyelets heavy</option>
                          </select>
                          <select
                            value={line.hemming}
                            onChange={(e) =>
                              updateLine(line.id, {
                                hemming: e.target.value as "NONE" | "ALL_4" | "TOP_BOTTOM",
                              })
                            }
                            className="h-7 w-full rounded border bg-background text-xs"
                          >
                            <option value="NONE">No hem</option>
                            <option value="ALL_4">Hem all 4</option>
                            <option value="TOP_BOTTOM">Hem top+bottom</option>
                          </select>
                        </div>
                      </td>
                      {overridePerLine && (
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={line.marginPercentOverride ?? ""}
                            onChange={(e) =>
                              updateLine(line.id, {
                                marginPercentOverride:
                                  e.target.value === ""
                                    ? undefined
                                    : Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                              })
                            }
                            className="h-8 w-14 text-right text-sm"
                          />
                        </td>
                      )}
                      <td className="p-2 text-right font-medium">
                        {result ? formatKes(result.unitPrice) : "—"}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {result ? formatKes(result.lineTotal) : "—"}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateLine(line.id)}
                            disabled={lines.length >= MAX_LINE_ITEMS}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal (inc VAT)</span>
            <span>{formatKes(subtotalIncVat)}</span>
          </div>
          <div className="flex justify-between text-sm gap-4">
            <span>Discount (KES)</span>
            <Input
              type="number"
              min={0}
              value={discountKes === "" ? "" : discountKes}
              onChange={(e) =>
                setDiscountKes(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="w-28 h-8 text-right"
            />
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>{formatKes(finalTotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Production cost: {formatKes(totalProductionCost)} · Profit: {formatKes(totalProfit)}
            {belowBreakEven && (
              <span className="text-amber-600 ml-2">⚠ Below break-even</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-3 border-t mt-3">
            <Button
              size="sm"
              onClick={() => window.print()}
              className="flex-1 min-w-[140px]"
            >
              <FileText className="h-4 w-4 mr-1.5" />
              Generate PDF quote
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="min-w-[140px]"
            >
              <a
                href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                  `PrintHub quote for ${clientName || "customer"}\nValid until: ${validUntil}\nTotal: ${formatKes(finalTotal)}\n\nDetails: ${lines.map((l, i) => `${i + 1}. ${l.description || "Item"} ${l.widthCm}×${l.heightCm}cm × ${l.quantity} = ${lineResults.find((r) => r.lineId === l.id) ? formatKes(lineResults.find((r) => r.lineId === l.id)!.lineTotal) : "—"}`).join("\n")}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Send via WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
