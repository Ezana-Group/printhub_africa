"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableToolbar, type FilterConfig } from "@/components/admin/ui/TableToolbar";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { TableEmptyState } from "@/components/admin/ui/TableEmptyState";
import { useTableUrlState } from "@/hooks/useTableUrlState";
import type { LFStockItemSerialized } from "@/components/admin/inventory-tabs";
import { Search, Package, Plus, MoreHorizontal } from "lucide-react";

const CATEGORIES = [
  { value: "SUBSTRATE_ROLL", label: "Substrate (roll)" },
  { value: "LAMINATION", label: "Lamination" },
  { value: "FINISHING", label: "Finishing (eyelets, tape, etc.)" },
  { value: "INK", label: "Ink" },
];

const CATEGORY_BADGE: Record<string, string> = {
  FINISHING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  LAMINATION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SUBSTRATE_ROLL: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  INK: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const UNIT_TYPES = [
  { value: "ROLL_LM", label: "Roll (per linear metre)" },
  { value: "SHEET", label: "Sheet" },
  { value: "UNIT", label: "Unit (each)" },
  { value: "BOTTLE_ML", label: "Bottle (ml)" },
];

function formatKes(n: number) {
  return `KES ${n.toLocaleString()}`;
}

function unitSuffix(unitType: string): string {
  if (unitType === "ROLL_LM") return "/lm";
  if (unitType === "BOTTLE_ML") return "/bottle";
  return "/unit";
}

export function LargeFormatInventorySection({
  lfStockItems: initialItems,
}: {
  lfStockItems: LFStockItemSerialized[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<LFStockItemSerialized[]>(initialItems);
  const url = useTableUrlState({ defaultPerPage: 25 });

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const categoryFilter = url.get("category", "");
  const stockStatusFilter = url.get("stockStatus", "");

  const filteredAndSorted = useMemo(() => {
    let list = [...items];
    const q = url.q.toLowerCase().trim();
    if (q) {
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
    }
    if (categoryFilter) list = list.filter((i) => i.category === categoryFilter);
    if (stockStatusFilter === "out") list = list.filter((i) => i.quantityOnHand <= 0);
    else if (stockStatusFilter === "low") list = list.filter((i) => i.lowStockThreshold > 0 && i.quantityOnHand > 0 && i.quantityOnHand <= i.lowStockThreshold);
    else if (stockStatusFilter === "in") list = list.filter((i) => i.lowStockThreshold <= 0 || i.quantityOnHand > i.lowStockThreshold);
    const field = url.sort || "code";
    const dir = url.dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      if (field === "code") return dir * a.code.localeCompare(b.code);
      if (field === "name") return dir * a.name.localeCompare(b.name);
      if (field === "category") return dir * a.category.localeCompare(b.category);
      if (field === "quantityOnHand") return dir * (a.quantityOnHand - b.quantityOnHand);
      if (field === "averageCostKes") return dir * (a.averageCostKes - b.averageCostKes);
      return 0;
    });
    return list;
  }, [items, url.q, categoryFilter, stockStatusFilter, url.sort, url.dir]);

  const paginated = useMemo(() => {
    const start = (url.page - 1) * url.perPage;
    return filteredAndSorted.slice(start, start + url.perPage);
  }, [filteredAndSorted, url.page, url.perPage]);

  const filters: FilterConfig[] = useMemo(
    () => [
      {
        key: "category",
        label: "Category",
        options: [{ value: "", label: "All" }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label }))],
        value: categoryFilter,
        onChange: (v) => url.set({ category: v || undefined, page: 1 }),
      },
      {
        key: "stockStatus",
        label: "Stock status",
        options: [
          { value: "", label: "All" },
          { value: "in", label: "In Stock" },
          { value: "low", label: "Low Stock" },
          { value: "out", label: "Out of Stock" },
        ],
        value: stockStatusFilter,
        onChange: (v) => url.set({ stockStatus: v || undefined, page: 1 }),
      },
    ],
    [categoryFilter, stockStatusFilter, url]
  );

  const hasActiveFilters = url.q !== "" || categoryFilter !== "" || stockStatusFilter !== "";

  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("SUBSTRATE_ROLL");
  const [unitType, setUnitType] = useState("ROLL_LM");
  const [rollWidthM, setRollWidthM] = useState<number | "">("");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | "">(0);
  const [quantityOnHand, setQuantityOnHand] = useState<number | "">(0);
  const [costPerUnit, setCostPerUnit] = useState<number | "">("");

  const [receiveItemCode, setReceiveItemCode] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState<number | "">("");
  const [receivePrice, setReceivePrice] = useState<number | "">("");
  const [receiveLoading, setReceiveLoading] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "_");
    if (!cleanCode || !name.trim()) {
      setError("Code and name are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/lf/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          name: name.trim(),
          category,
          unitType,
          rollWidthM: rollWidthM === "" ? undefined : Number(rollWidthM),
          lowStockThreshold: Number(lowStockThreshold) || 0,
          quantityOnHand: Number(quantityOnHand) || 0,
          costPerUnit: Number(costPerUnit) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Invalid input.");
        return;
      }
      router.refresh();
      const listRes = await fetch("/api/admin/inventory/lf/items");
      if (listRes.ok) {
        const list = await listRes.json();
        setItems(Array.isArray(list) ? list : []);
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: data.id,
            code: data.code,
            name: data.name,
            category: data.category,
            unitType: data.unitType,
            rollWidthM: data.rollWidthM ?? null,
            quantityOnHand: data.quantityOnHand ?? 0,
            lowStockThreshold: data.lowStockThreshold ?? 0,
            costPerUnit: data.costPerUnit ?? 0,
            lastPurchasePriceKes: null,
            averageCostKes: data.averageCostKes ?? 0,
            lastReceivedAt: null,
          },
        ]);
      }
      setCode("");
      setName("");
      setCategory("SUBSTRATE_ROLL");
      setUnitType("ROLL_LM");
      setRollWidthM("");
      setLowStockThreshold(0);
      setQuantityOnHand(0);
      setCostPerUnit("");
      setShowAddForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (itemCode: string) => {
    const q = Number(receiveQty);
    const p = Number(receivePrice);
    if (q <= 0) return;
    setReceiveLoading(true);
    try {
      const res = await fetch("/api/admin/inventory/lf/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: itemCode,
          quantityReceived: q,
          unitPriceKes: p,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReceiveItemCode(null);
        setReceiveQty("");
        setReceivePrice("");
        router.refresh();
        const listRes = await fetch("/api/admin/inventory/lf/items");
        if (listRes.ok) {
          const list = await listRes.json();
          setItems(Array.isArray(list) ? list : []);
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.code === itemCode
                ? {
                    ...i,
                    quantityOnHand: data.quantityOnHand ?? i.quantityOnHand + q,
                    averageCostKes: data.averageCostKes ?? i.averageCostKes,
                    lastPurchasePriceKes: p,
                    lastReceivedAt: new Date().toISOString(),
                  }
                : i
            )
          );
        }
      }
    } finally {
      setReceiveLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Large format service materials</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Materials and consumables for your large format printing services — separate from shop products. Add items here; they feed the quote calculator and cost engine.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? "Cancel" : "Add Item"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 && (
          <TableToolbar
            searchPlaceholder="Search by name or code..."
            searchValue={url.q}
            onSearch={url.setSearch}
            filters={filters}
            sortOptions={[
              { label: "Code", value: "code" },
              { label: "Name", value: "name" },
              { label: "Category", value: "category" },
              { label: "Qty on hand", value: "quantityOnHand" },
              { label: "Avg cost", value: "averageCostKes" },
            ]}
            currentSort={url.sort || "code"}
            currentSortDir={url.dir}
            onSortChange={url.setSort}
            totalCount={items.length}
            filteredCount={filteredAndSorted.length}
            onClearFilters={url.clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}
        {showAddForm && (
          <form
            onSubmit={handleAddItem}
            className="rounded-lg border bg-muted/30 p-4 space-y-4"
          >
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                {error}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Code (unique, e.g. VINYL_OUT_152)</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VINYL_OUT_152"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Outdoor Vinyl 1.52m"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Unit type</Label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {UNIT_TYPES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              {unitType === "ROLL_LM" && (
                <div>
                  <Label>Roll width (m) optional</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={rollWidthM === "" ? "" : rollWidthM}
                    onChange={(e) =>
                      setRollWidthM(
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    placeholder="1.52"
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label>Low stock threshold</Label>
                <Input
                  type="number"
                  min={0}
                  value={lowStockThreshold === "" ? "" : lowStockThreshold}
                  onChange={(e) =>
                    setLowStockThreshold(
                      e.target.value === ""
                        ? ""
                        : Math.max(0, parseInt(e.target.value, 10) || 0)
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Initial quantity on hand</Label>
                <Input
                  type="number"
                  min={0}
                  value={quantityOnHand === "" ? "" : quantityOnHand}
                  onChange={(e) =>
                    setQuantityOnHand(
                      e.target.value === ""
                        ? ""
                        : Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cost per unit (KES)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={costPerUnit === "" ? "" : costPerUnit}
                  onChange={(e) =>
                    setCostPerUnit(
                      e.target.value === ""
                        ? ""
                        : Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  placeholder="e.g. 178.50"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used by the cost engine. Use &quot;Receive&quot; to update average cost when you buy more.
                </p>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add item"}
            </Button>
          </form>
        )}

        {filteredAndSorted.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Code</th>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-right p-4 font-medium">Qty on hand</th>
                    <th className="text-right p-4 font-medium">Avg cost</th>
                    <th className="text-right p-4 font-medium">Last purchase</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((i) => {
                    const isLow = i.lowStockThreshold > 0 && i.quantityOnHand > 0 && i.quantityOnHand <= i.lowStockThreshold;
                    const isOut = i.quantityOnHand <= 0;
                    const qtyTitle = i.lowStockThreshold > 0
                      ? isOut
                        ? "Out of stock"
                        : isLow
                          ? `Threshold: ${i.lowStockThreshold} — LOW STOCK`
                          : `Threshold: ${i.lowStockThreshold} — above threshold`
                      : "No threshold set";
                    const qtyColor = isOut ? "text-red-600 font-medium" : isLow ? "text-amber-600" : "text-green-700 dark:text-green-400";
                    return (
                      <tr
                        key={i.id}
                        className={`border-b hover:bg-muted/30 ${isLow ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                      >
                        <td className="p-4">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{i.code}</span>
                        </td>
                        <td className="p-4 font-medium">{i.name}</td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[i.category] ?? "bg-muted text-muted-foreground"}`}>
                            {i.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-4 text-right" title={qtyTitle}>
                          <span className={qtyColor}>
                            {i.quantityOnHand}
                            {i.unitType === "ROLL_LM" ? " lm" : ""}
                            {isLow && " (low)"}
                            {isOut && " — Out of Stock"}
                          </span>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">
                          {formatKes(i.averageCostKes)}{unitSuffix(i.unitType)}
                        </td>
                        <td className="p-4 text-right text-muted-foreground" title={i.lastReceivedAt == null ? "No stock received yet. Use 'Receive stock' to log first receipt." : undefined}>
                          {i.lastPurchasePriceKes != null ? formatKes(i.lastPurchasePriceKes) : "—"}
                        </td>
                        <td className="p-4">
                          {receiveItemCode === i.code ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                type="number"
                                min={0.01}
                                placeholder="Qty"
                                value={receiveQty === "" ? "" : receiveQty}
                                onChange={(e) => setReceiveQty(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-sm"
                              />
                              <Input
                                type="number"
                                min={0}
                                placeholder="Price/unit"
                                value={receivePrice === "" ? "" : receivePrice}
                                onChange={(e) => setReceivePrice(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                                className="w-24 h-8 text-sm"
                              />
                              <Button size="sm" onClick={() => handleReceive(i.code)} disabled={receiveLoading || Number(receiveQty) <= 0}>
                                {receiveLoading ? "Saving…" : "Save"}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setReceiveItemCode(null); setReceiveQty(""); setReceivePrice(""); }}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setReceiveItemCode(i.code); setReceiveQty(""); setReceivePrice(""); }}
                              >
                                Receive stock
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setReceiveItemCode(i.code); setReceiveQty(""); setReceivePrice(""); }}>
                                    Receive stock
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled>Edit (coming soon)</DropdownMenuItem>
                                  <DropdownMenuItem disabled>View movements (coming soon)</DropdownMenuItem>
                                  <DropdownMenuItem disabled>Set threshold (coming soon)</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              totalCount={filteredAndSorted.length}
              page={url.page}
              perPage={url.perPage}
              onPageChange={url.setPage}
              onPerPageChange={url.setPerPage}
              perPageOptions={[10, 25, 50, 100]}
            />
          </>
        ) : items.length > 0 ? (
          <TableEmptyState
            icon={Search}
            title="No items match your filters"
            description="Try adjusting your search or filters."
            actionLabel="Clear filters"
            onAction={url.clearFilters}
          />
        ) : (
          <TableEmptyState
            icon={Package}
            title="No large format items yet"
            description="Click Add Item to add materials you use for printing services (e.g. vinyl rolls, lamination, eyelets)."
            actionLabel="Add Item"
            onAction={() => setShowAddForm(true)}
          />
        )}
      </CardContent>
    </Card>
  );
}
