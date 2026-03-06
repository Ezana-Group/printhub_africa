"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { use3DRates } from "@/hooks/use3DRates";
import {
  calculatePrintCost,
  formatKes,
  type PrintJob,
} from "@/lib/3d-calculator-engine";
import {
  COLOUR_PILLS,
  BRAND_COLOUR_HEX,
  canonicalColorFromSpec,
  colorMatches,
  PREFERRED_MATERIAL_ORDER,
} from "@/lib/3d-colour-utils";
import { Plus, Trash2, FileText, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearQuoteDraft, type QuoteDraft3D } from "@/lib/quote-draft";

const MAX_LINE_ITEMS = 20;

type MaterialWithColors = import("@/lib/3d-calculator-engine").MaterialRate & { colorOptions?: string[]; baseMaterial?: string; color?: string; quantity?: number };
type LineItem = {
  id: string;
  description: string;
  materialCode: string;
  color: string;
  weightGrams: number;
  printTimeHours: number;
  quantity: number;
  postProcessing: boolean;
  marginPercentOverride?: number;
};

function newLineItem(): LineItem {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    materialCode: "",
    color: "",
    weightGrams: 0,
    printTimeHours: 0,
    quantity: 1,
    postProcessing: false,
  };
}

type PrinterOption = { id: string; name: string; source?: string; status?: string; nextScheduledMaintDate?: string | null };

export function SalesPrintCalculator({
  initialDraft,
}: {
  initialDraft?: QuoteDraft3D;
} = {}) {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | "">("");
  const { data: rates, loading: ratesLoading } = use3DRates(selectedPrinterId || undefined);
  const [lines, setLines] = useState<LineItem[]>(() => [newLineItem()]);
  const [printerOptions, setPrinterOptions] = useState<PrinterOption[]>([]);
  const [globalMarginPercent, setGlobalMarginPercent] = useState(40);
  const [overridePerLine, setOverridePerLine] = useState(false);
  const [discountType, setDiscountType] = useState<"kes" | "percent">("kes");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [discountReason, setDiscountReason] = useState("");
  const [clientName, setClientName] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!initialDraft || initialDraft.type !== "3d") return;
    const d = initialDraft;
    setClientName(d.clientName);
    setValidUntil(d.validUntil);
    setGlobalMarginPercent(d.globalMarginPercent);
    setDiscountType(d.discountType);
    setDiscountValue(d.discountValue);
    setDiscountReason(d.discountReason);
    setLines(
      d.lines.length > 0
        ? d.lines.map((l, i) => ({
            id: `line_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 9)}`,
            description: l.description,
            materialCode: l.materialCode,
            color: l.color,
            weightGrams: l.weightGrams,
            printTimeHours: l.printTimeHours,
            quantity: l.quantity,
            postProcessing: l.postProcessing,
            marginPercentOverride: l.marginPercentOverride,
          }))
        : [newLineItem()]
    );
    clearQuoteDraft();
  }, [initialDraft]);

  const materials: MaterialWithColors[] = rates?.materials ?? [];
  const settings = rates?.printerSettings;

  const { materialTypes, byMaterialType, availableColorSet, inStockColorSet } = useMemo(() => {
    const byBase: Record<string, { code: string; name: string; color: string; quantity: number }[]> = {};
    for (const m of materials) {
      const base = m.baseMaterial ?? (m.name.replace(/\s*\([^)]*\)\s*$/, "").trim() || m.name);
      if (!byBase[base]) byBase[base] = [];
      const rawColor = (m as MaterialWithColors).color ?? ((m.name.match(/\s*\(([^)]+)\)\s*$/) ?? [])[1]?.trim());
      const canonical = canonicalColorFromSpec(rawColor);
      const quantity = (m as MaterialWithColors).quantity ?? 0;
      byBase[base].push({ code: m.code, name: m.name, color: canonical, quantity });
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
          if (x.quantity > 0) inStock.add(pill.id);
        } else {
          pillIds.add(x.color);
          if (x.quantity > 0) inStock.add(x.color);
        }
      }
      colorSet[t] = pillIds;
      inStockSet[t] = inStock;
    }
    return { materialTypes: sorted, byMaterialType: byBase, availableColorSet: colorSet, inStockColorSet: inStockSet };
  }, [materials]);

  function getMaterialTypeForCode(code: string): string {
    for (const mt of materialTypes) {
      const list = byMaterialType[mt] ?? [];
      if (list.some((x) => x.code === code)) return mt;
    }
    return materialTypes[0] ?? "";
  }

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
  }, []);

  useEffect(() => {
    if (materialTypes.length && lines.length > 0 && !lines[0].materialCode) {
      const firstType = materialTypes[0];
      const list = byMaterialType[firstType] ?? [];
      const firstInStock = list.find((x) => x.quantity > 0) ?? list[0];
      const firstColor = firstInStock ? (COLOUR_PILLS.find((p) => colorMatches(firstInStock.color, p.id))?.id ?? firstInStock.color) : "";
      setLines((prev) =>
        prev.map((l, i) =>
          i === 0
            ? { ...l, materialCode: firstInStock?.code ?? "", color: firstColor }
            : l
        )
      );
    }
  }, [materialTypes, byMaterialType, lines]);

  const lineResults = useMemo(() => {
    if (!settings || !materials.length) return [];
    return lines.map((line) => {
      const margin =
        overridePerLine && line.marginPercentOverride != null
          ? line.marginPercentOverride
          : globalMarginPercent;
      const job: PrintJob = {
        name: line.description || "Item",
        material: line.materialCode || (materials[0]?.code ?? ""),
        weightGrams: line.weightGrams,
        printTimeHours: line.printTimeHours,
        postProcessing: line.postProcessing,
        quantity: line.quantity,
      };
      try {
        const b = calculatePrintCost(
          job,
          { ...settings, profitMarginPercent: margin },
          materials
        );
        return {
          lineId: line.id,
          unitPrice: b.perUnitSellingPrice,
          lineTotal: b.sellingPriceIncVat,
          productionCost: b.totalProductionCost,
          marginPercent: margin,
          lowMargin: margin < 25,
          veryLowMargin: margin < 15,
        };
      } catch {
        return {
          lineId: line.id,
          unitPrice: 0,
          lineTotal: 0,
          productionCost: 0,
          marginPercent: margin,
          lowMargin: false,
          veryLowMargin: false,
        };
      }
    });
  }, [lines, settings, materials, globalMarginPercent, overridePerLine]);

  const subtotalExVat = useMemo(
    () =>
      lineResults.reduce((s, r) => s + r.lineTotal / (1 + (settings?.vatRatePercent ?? 16) / 100), 0),
    [lineResults, settings?.vatRatePercent]
  );
  const vatRate = (settings?.vatRatePercent ?? 16) / 100;
  const vatAmount = subtotalExVat * vatRate;
  const totalBeforeDiscount = subtotalExVat + vatAmount;
  const discountAmount =
    discountType === "percent"
      ? totalBeforeDiscount * ((Number(discountValue) || 0) / 100)
      : Number(discountValue) || 0;
  const finalTotal = Math.max(0, totalBeforeDiscount - discountAmount);
  const totalProductionCost = lineResults.reduce((s, r) => s + r.productionCost, 0);
  const breakEven = totalProductionCost;
  const belowBreakEven = finalTotal < breakEven && discountAmount > 0;

  const addLine = () => {
    if (lines.length >= MAX_LINE_ITEMS) return;
    const firstType = materialTypes[0];
    const list = byMaterialType[firstType] ?? [];
    const firstInStock = list.find((x) => x.quantity > 0) ?? list[0];
    const firstColor = firstInStock ? (COLOUR_PILLS.find((p) => colorMatches(firstInStock.color, p.id))?.id ?? firstInStock.color) : "";
    setLines((prev) => [
      ...prev,
      {
        ...newLineItem(),
        materialCode: firstInStock?.code ?? "",
        color: firstColor,
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, updates: Partial<LineItem>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const duplicateLine = (id: string) => {
    if (lines.length >= MAX_LINE_ITEMS) return;
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    setLines((prev) => [...prev, { ...line, id: newLineItem().id }]);
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
        <h2 className="font-display text-xl font-bold">New quote builder</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">3D Printer</Label>
            <select
              value={selectedPrinterId}
              onChange={(e) => setSelectedPrinterId(e.target.value)}
              className="rounded border bg-background px-2 py-1.5 text-sm"
            >
              {printerOptions.length === 0 ? (
                <option value="">Default</option>
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
            {selectedPrinterId && printerOptions.find((p) => p.id === selectedPrinterId)?.source === "PrinterAsset" && (
              <Link href={`/admin/inventory/hardware/printers/${selectedPrinterId}`} className="text-xs text-primary hover:underline">
                View printer
              </Link>
            )}
          </div>
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 w-8">#</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2">Colour</th>
                  <th className="text-right p-2 w-20">g</th>
                  <th className="text-right p-2 w-20">hrs</th>
                  <th className="text-right p-2 w-16">Qty</th>
                  {overridePerLine && (
                    <th className="text-right p-2 w-20">Margin %</th>
                  )}
                  <th className="text-right p-2">Unit price</th>
                  <th className="text-right p-2">Total</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const result = lineResults.find((r) => r.lineId === line.id);
                  return (
                    <tr key={line.id} className="border-b hover:bg-muted/30">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        <Input
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                          placeholder="e.g. Phone stand"
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={getMaterialTypeForCode(line.materialCode)}
                          onChange={(e) => {
                            const mt = e.target.value;
                            const list = byMaterialType[mt] ?? [];
                            const firstInStock = list.find((x) => x.quantity > 0) ?? list[0];
                            const firstColor = firstInStock ? (COLOUR_PILLS.find((p) => colorMatches(firstInStock.color, p.id))?.id ?? firstInStock.color) : "";
                            updateLine(line.id, {
                              materialCode: firstInStock?.code ?? "",
                              color: firstColor,
                            });
                          }}
                          className="h-8 w-full rounded border bg-background text-sm"
                        >
                          {materialTypes.map((mt) => {
                            const list = byMaterialType[mt] ?? [];
                            const totalSpools = list.reduce((s, x) => s + x.quantity, 0);
                            return (
                              <option key={mt} value={mt}>
                                {mt}{list.length ? ` — ${totalSpools} spool${totalSpools !== 1 ? "s" : ""}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="p-2">
                        {(() => {
                          const mt = getMaterialTypeForCode(line.materialCode);
                          const available = availableColorSet[mt] ?? new Set<string>();
                          const inStock = inStockColorSet[mt] ?? new Set<string>();
                          const list = byMaterialType[mt] ?? [];
                          if (available.size === 0) return <span className="text-muted-foreground text-xs">—</span>;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {COLOUR_PILLS.map((pill) => {
                                const avail = available.has(pill.id);
                                const stock = inStock.has(pill.id);
                                const disabled = !avail || !stock;
                                const selected = line.color === pill.id;
                                const isWhite = pill.id === "White";
                                const stockItem = list.find((x) => colorMatches(x.color, pill.id));
                                const spools = stockItem?.quantity ?? 0;
                                const title = !avail ? `Not in ${mt}` : !stock ? "Out of stock" : `${pill.label} — ${spools} spool${spools !== 1 ? "s" : ""}`;
                                return (
                                  <button
                                    key={pill.id}
                                    type="button"
                                    disabled={disabled}
                                    title={title}
                                    onClick={() => {
                                      if (!avail || !stock) return;
                                      const item = list.find((x) => colorMatches(x.color, pill.id));
                                      if (item) updateLine(line.id, { materialCode: item.code, color: pill.id });
                                    }}
                                    className={cn(
                                      "relative rounded-full shrink-0 flex items-center justify-center",
                                      selected ? "w-7 h-7" : "w-6 h-6",
                                      disabled && "opacity-30 cursor-not-allowed"
                                    )}
                                    style={{
                                      width: selected ? 28 : 24,
                                      height: selected ? 28 : 24,
                                      backgroundColor: pill.pattern ? "transparent" : pill.bg,
                                      border: isWhite ? "2px solid #CBD5E0" : "1px solid #E2E8F0",
                                      outline: selected ? `2px solid ${BRAND_COLOUR_HEX}` : "none",
                                      outlineOffset: 1,
                                      backgroundImage: pill.pattern
                                        ? "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%)"
                                        : undefined,
                                      backgroundSize: pill.pattern ? "6px 6px" : undefined,
                                    }}
                                  >
                                    {selected && <Check className="absolute h-3 w-3 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" strokeWidth={3} />}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          value={line.weightGrams || ""}
                          onChange={(e) =>
                            updateLine(line.id, {
                              weightGrams: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="h-8 w-20 text-right text-sm"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={line.printTimeHours || ""}
                          onChange={(e) =>
                            updateLine(line.id, {
                              printTimeHours: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="h-8 w-20 text-right text-sm"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.id, {
                              quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="h-8 w-14 text-right text-sm"
                        />
                      </td>
                      {overridePerLine && (
                        <td className="p-2 text-right">
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
                            className="h-8 w-16 text-right text-sm"
                          />
                        </td>
                      )}
                      <td className="p-2 text-right font-medium">
                        {result ? formatKes(result.unitPrice) : "—"}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {result ? formatKes(result.lineTotal) : "—"}
                        {result?.lowMargin && (
                          <span className="ml-1 text-amber-600 text-xs">
                            Low margin
                          </span>
                        )}
                        {result?.veryLowMargin && (
                          <span className="ml-1 text-red-600 text-xs">
                            Below min
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateLine(line.id)}
                            title="Duplicate line"
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quote summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Total production cost</span>
              <span>{formatKes(totalProductionCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal (ex VAT)</span>
              <span>{formatKes(subtotalExVat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT (16%)</span>
              <span>{formatKes(vatAmount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total (inc VAT)</span>
              <span>{formatKes(totalBeforeDiscount)}</span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex gap-2 items-center">
                <select
                  value={discountType}
                  onChange={(e) =>
                    setDiscountType(e.target.value as "kes" | "percent")
                  }
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="kes">Discount (KES)</option>
                  <option value="percent">Discount (%)</option>
                </select>
                <Input
                  type="number"
                  min={0}
                  value={discountValue === "" ? "" : discountValue}
                  onChange={(e) =>
                    setDiscountValue(
                      e.target.value === ""
                        ? ""
                        : Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="w-24"
                />
              </div>
              <Input
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Discount reason (required if discount &gt; 0)"
                className="text-sm"
              />
              {belowBreakEven && (
                <p className="text-sm text-red-600">
                  Final total is below break-even. Increase price or reduce
                  discount.
                </p>
              )}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-primary">
              <span>Final quote total</span>
              <span>{formatKes(finalTotal)}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Label className="flex items-center gap-2 text-sm w-full">
                <input
                  type="checkbox"
                  checked={overridePerLine}
                  onChange={(e) => setOverridePerLine(e.target.checked)}
                />
                Override margin per line item
              </Label>
              <div className="flex items-center gap-2 w-full">
                <Label className="text-sm">Default margin</Label>
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={globalMarginPercent}
                  onChange={(e) =>
                    setGlobalMarginPercent(parseInt(e.target.value, 10))
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium">{globalMarginPercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client view preview</CardTitle>
            <p className="text-xs text-muted-foreground">
              What the customer will see
            </p>
          </CardHeader>
          <CardContent className="space-y-3 bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              Quote for: {clientName || "[Client name]"}
            </p>
            <p className="text-xs text-muted-foreground">
              Valid until: {validUntil}
            </p>
            <div className="border-t pt-2 space-y-1 text-sm">
              {lines.map((line, idx) => {
                const result = lineResults.find((r) => r.lineId === line.id);
                return (
                  <div
                    key={line.id}
                    className="flex justify-between"
                  >
                    <span>
                      {idx + 1}. {line.description || "Item"} ×{line.quantity}
                    </span>
                    <span>{result ? formatKes(result.lineTotal) : "—"}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-2 flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatKes(subtotalExVat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT (16%)</span>
              <span>{formatKes(vatAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>- {formatKes(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatKes(finalTotal)}</span>
            </div>
            <div className="pt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="flex-1 min-w-[140px]"
                onClick={() => window.print()}
              >
                <FileText className="h-4 w-4 mr-1" />
                Generate PDF quote
              </Button>
              <Button size="sm" variant="outline" asChild className="min-w-[140px]">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `PrintHub quote for ${clientName || "customer"}\nValid until: ${validUntil}\nTotal: ${formatKes(finalTotal)}\n\nDetails: ${lines.map((l, i) => `${i + 1}. ${l.description || "Item"} × ${l.quantity} = ${lineResults.find((r) => r.lineId === l.id) ? formatKes(lineResults.find((r) => r.lineId === l.id)!.lineTotal) : "—"}`).join("\n")}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Send via WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
