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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableToolbar, type FilterConfig } from "@/components/admin/ui/TableToolbar";
import { TableEmptyState } from "@/components/admin/ui/TableEmptyState";
import { useTableUrlState } from "@/hooks/useTableUrlState";
import { Search, Wrench, Puzzle, Plus, MoreHorizontal, Eye, Pencil, History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type HardwareItemSerialized = {
  id: string;
  name: string;
  category: string;
  priceKes: number;
  location: string | null;
  linkedPrinterId: string | null;
  timeHours: number | null;
  hardwareType: string | null;
  printerSubType: string | null;
  model: string | null;
  maxPrintWidthM: number | null;
  printSpeedSqmPerHour: number | null;
  setupTimeHours: number | null;
  lifespanHours: number | null;
  annualMaintenanceKes: number | null;
  powerWatts: number | null;
  electricityRateKesKwh: number | null;
  maintenancePerYearKes: number | null;
  postProcessingTimeHours: number | null;
  isActive: boolean;
  sortOrder: number;
  source?: "INVENTORY" | "CORE_ASSET";
};

const HARDWARE_TYPES = [
  { value: "", label: "Generic hardware" },
  { value: "LARGE_FORMAT_PRINTER", label: "Large format printer" },
  { value: "THREE_D_PRINTER", label: "3D printer" },
];

const LARGE_FORMAT_SUB_TYPES = [
  { value: "", label: "— Select sub-type —" },
  { value: "SOLVENT", label: "Solvent" },
  { value: "ECO_SOLVENT", label: "Eco-solvent" },
  { value: "LATEX", label: "Latex" },
  { value: "UV", label: "UV (flatbed/roll)" },
  { value: "DYE_SUBLIMATION", label: "Dye-sublimation" },
  { value: "OTHER", label: "Other" },
];

const THREE_D_SUB_TYPES = [
  { value: "", label: "— Select sub-type —" },
  { value: "FDM", label: "FDM (Fused Deposition Modeling)" },
  { value: "RESIN", label: "Resin (SLA / MSLA)" },
  { value: "DLP", label: "DLP" },
  { value: "SLS", label: "SLS (Selective Laser Sintering)" },
  { value: "BINDER_JETTING", label: "Binder Jetting" },
  { value: "OTHER", label: "Other" },
];

function formatSubType(value: string | null): string {
  if (!value) return "—";
  const lf = LARGE_FORMAT_SUB_TYPES.find((o) => o.value === value);
  if (lf) return lf.label;
  const td = THREE_D_SUB_TYPES.find((o) => o.value === value);
  if (td) return td.label;
  return value.replace(/_/g, " ");
}

function formatKes(n: number) {
  return `KES ${n.toLocaleString()}`;
}

function costPerHourKes(i: HardwareItemSerialized): number | null {
  const lifespan = i.lifespanHours ?? 0;
  if (lifespan <= 0) return null;
  const maintenance = i.maintenancePerYearKes ?? i.annualMaintenanceKes ?? 0;
  const maintenancePerHr = maintenance / 8760;
  const depreciationPerHr = i.priceKes / lifespan;
  return depreciationPerHr + maintenancePerHr;
}

export function InventoryHardwareSection({
  category,
  title,
  description,
  initialItems,
  printerAssets = [],
}: {
  category: "HARDWARE" | "MAINTENANCE" | "PRINTER_ACCESSORIES";
  title: string;
  description: string;
  initialItems: HardwareItemSerialized[];
  printerAssets?: Array<{ 
    id: string; 
    name: string; 
    location: string | null; 
    printerType: string; 
    status: string; 
    priceKes: number; 
    lifespanHours: number | null; 
    powerWatts: number | null; 
    maintenancePerYearKes: number | null; 
    isActive: boolean;
  }>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<HardwareItemSerialized[]>(initialItems);
  const url = useTableUrlState({ defaultPerPage: 25 });
  const typeFilter = url.get("type", "");
  const subTypeFilter = url.get("subType", "");
  const statusFilter = url.get("status", "");

  const filteredList = useMemo(() => {
    const list = items.filter((i) => i.category === category).map(i => ({ ...i, source: "INVENTORY" as const }));
    
    // Merge printerAssets if category is HARDWARE
    if (category === "HARDWARE" && printerAssets) {
      const coreAssets = printerAssets.map(pa => ({
        id: pa.id,
        name: pa.name,
        category: "HARDWARE",
        priceKes: pa.priceKes,
        location: pa.location,
        linkedPrinterId: null,
        timeHours: null,
        hardwareType: pa.printerType === "LARGE_FORMAT" ? "LARGE_FORMAT_PRINTER" : "THREE_D_PRINTER",
        printerSubType: null,
        model: null,
        maxPrintWidthM: null,
        printSpeedSqmPerHour: null,
        setupTimeHours: null,
        lifespanHours: pa.lifespanHours,
        annualMaintenanceKes: null,
        powerWatts: pa.powerWatts,
        electricityRateKesKwh: 24, // Default
        maintenancePerYearKes: pa.maintenancePerYearKes,
        postProcessingTimeHours: null,
        isActive: pa.isActive,
        sortOrder: 0,
        source: "CORE_ASSET" as const
      }));
      return [...list, ...coreAssets];
    }
    
    return list;
  }, [items, category, printerAssets]);

  const filteredAndSorted = useMemo(() => {
    let list = [...filteredList];
    const q = url.q.toLowerCase().trim();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.model?.toLowerCase().includes(q)));
    if (category === "HARDWARE") {
      if (typeFilter === "3D") list = list.filter((i) => i.hardwareType === "THREE_D_PRINTER");
      else if (typeFilter === "LF") list = list.filter((i) => i.hardwareType === "LARGE_FORMAT_PRINTER");
      if (subTypeFilter) list = list.filter((i) => (i.printerSubType ?? "") === subTypeFilter);
      if (statusFilter === "active") list = list.filter((i) => i.isActive);
      else if (statusFilter === "inactive") list = list.filter((i) => !i.isActive);
    }
    const field = url.sort || "name";
    const dir = url.dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      if (field === "name") return dir * a.name.localeCompare(b.name);
      if (field === "priceKes") return dir * (a.priceKes - b.priceKes);
      if (field === "lifespanHours") return dir * ((a.lifespanHours ?? 0) - (b.lifespanHours ?? 0));
      return 0;
    });
    return list;
  }, [filteredList, url.q, typeFilter, subTypeFilter, statusFilter, category, url.sort, url.dir]);

  const filters: FilterConfig[] = useMemo(() => {
    const f: FilterConfig[] = [];
    if (category === "HARDWARE") {
      f.push(
        {
          key: "type",
          label: "Type",
          options: [
            { value: "", label: "All" },
            { value: "3D", label: "3D Printer" },
            { value: "LF", label: "Large Format" },
          ],
          value: typeFilter,
          onChange: (v) => url.set({ type: v || undefined, page: 1 }),
        },
        {
          key: "status",
          label: "Status",
          options: [
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
          value: statusFilter,
          onChange: (v) => url.set({ status: v || undefined, page: 1 }),
        }
      );
    }
    return f;
  }, [category, typeFilter, statusFilter, url]);

  const hasActiveFilters = url.q !== "" || typeFilter !== "" || subTypeFilter !== "" || statusFilter !== "";

  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editItem, setEditItem] = useState<HardwareItemSerialized | null>(null);
  const [deleteItem, setDeleteItem] = useState<HardwareItemSerialized | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [priceKes, setPriceKes] = useState<number | "">("");
  const [hardwareType, setHardwareType] = useState("");
  const [printerSubType, setPrinterSubType] = useState("");
  const [model, setModel] = useState("");
  const [maxPrintWidthM, setMaxPrintWidthM] = useState<number | "">("");
  const [printSpeedSqmPerHour, setPrintSpeedSqmPerHour] = useState<number | "">("");
  const [setupTimeHours, setSetupTimeHours] = useState<number | "">("");
  const [lifespanHours, setLifespanHours] = useState<number | "">("");
  const [annualMaintenanceKes, setAnnualMaintenanceKes] = useState<number | "">("");
  const [powerWatts, setPowerWatts] = useState<number | "">("");
  const [electricityRateKesKwh, setElectricityRateKesKwh] = useState<number | "">("");
  const [maintenancePerYearKes, setMaintenancePerYearKes] = useState<number | "">("");
  const [postProcessingTimeHours, setPostProcessingTimeHours] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [linkedPrinterId, setLinkedPrinterId] = useState("");
  const [timeHours, setTimeHours] = useState<number | "">("");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const hardwarePrinters = initialItems.filter(
    (i) => i.category === "HARDWARE" && i.isActive && (i.hardwareType === "LARGE_FORMAT_PRINTER" || i.hardwareType === "THREE_D_PRINTER")
  );
  const printerOptions = [...printerAssets, ...hardwarePrinters];
  const getPrinterName = (id: string | null) => (id ? printerOptions.find((p) => p.id === id)?.name ?? id : "—");
  const getPrinterIdByName = (itemName: string) => printerAssets.find((a) => a.name === itemName)?.id;

  const handleEditSaved = (updated: HardwareItemSerialized) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/inventory/hardware-items/${deleteItem.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const isLF = hardwareType === "LARGE_FORMAT_PRINTER";
  const is3D = hardwareType === "THREE_D_PRINTER";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const price = Number(priceKes);
    if (price < 0) {
      setError("Price must be ≥ 0.");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        priceKes: price,
        hardwareType: category === "HARDWARE" ? (hardwareType || null) : null,
        printerSubType: category === "HARDWARE" && (isLF || is3D) ? (printerSubType || null) : null,
      };
      if (category === "HARDWARE") {
        body.location = location.trim() || null;
      }
      if (category === "MAINTENANCE" || category === "PRINTER_ACCESSORIES") {
        body.linkedPrinterId = linkedPrinterId.trim() || null;
        body.timeHours = timeHours === "" ? null : Number(timeHours);
      }
      if (isLF) {
        body.model = model.trim() || null;
        body.maxPrintWidthM = maxPrintWidthM === "" ? null : Number(maxPrintWidthM);
        body.printSpeedSqmPerHour = printSpeedSqmPerHour === "" ? null : Number(printSpeedSqmPerHour);
        body.setupTimeHours = setupTimeHours === "" ? null : Number(setupTimeHours);
        body.lifespanHours = lifespanHours === "" ? null : Number(lifespanHours);
        body.annualMaintenanceKes = annualMaintenanceKes === "" ? null : Number(annualMaintenanceKes);
        body.powerWatts = powerWatts === "" ? null : Number(powerWatts);
        body.electricityRateKesKwh = electricityRateKesKwh === "" ? null : Number(electricityRateKesKwh);
      }
      if (is3D) {
        body.powerWatts = powerWatts === "" ? null : Number(powerWatts);
        body.electricityRateKesKwh = electricityRateKesKwh === "" ? null : Number(electricityRateKesKwh);
        body.lifespanHours = lifespanHours === "" ? null : Number(lifespanHours);
        body.maintenancePerYearKes = maintenancePerYearKes === "" ? null : Number(maintenancePerYearKes);
        body.postProcessingTimeHours = postProcessingTimeHours === "" ? null : Number(postProcessingTimeHours);
      }
      const res = await fetch("/api/admin/inventory/hardware-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to add item.");
        return;
      }
      router.refresh();
      setItems((prev) => [...prev, data as HardwareItemSerialized]);
      setName("");
      setPriceKes("");
      setHardwareType("");
      setPrinterSubType("");
      setModel("");
      setMaxPrintWidthM("");
      setPrintSpeedSqmPerHour("");
      setSetupTimeHours("");
      setLifespanHours("");
      setAnnualMaintenanceKes("");
      setPowerWatts("");
      setElectricityRateKesKwh("");
      setMaintenancePerYearKes("");
      setPostProcessingTimeHours("");
      setLocation("");
      setLinkedPrinterId("");
      setTimeHours("");
      setShowAddForm(false);
    } finally {
      setLoading(false);
    }
  };

  const addButtonLabel = category === "HARDWARE" ? "Add Hardware" : category === "MAINTENANCE" ? "Add maintenance" : "Add Accessory";

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => setShowAddForm((v) => !v)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? "Cancel" : addButtonLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <form onSubmit={handleAdd} className="rounded-lg border bg-muted/30 p-4 space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                {error}
              </p>
            )}
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Roland VG3-540"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Price (KES)</Label>
              <Input
                type="number"
                min={0}
                value={priceKes === "" ? "" : priceKes}
                onChange={(e) =>
                  setPriceKes(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))
                }
                placeholder="0"
                className="mt-1"
                required
              />
            </div>
            {category === "HARDWARE" && (
              <div>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Production floor A"
                  className="mt-1"
                />
              </div>
            )}
            {(category === "MAINTENANCE" || category === "PRINTER_ACCESSORIES") && (
              <>
                <div>
                  <Label>Printer</Label>
                  <select
                    value={linkedPrinterId}
                    onChange={(e) => setLinkedPrinterId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Select printer —</option>
                    {printerOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link this item to a printer so its cost and time are included when that printer is used in the quote calculator.
                  </p>
                </div>
                <div>
                  <Label>Time (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={timeHours === "" ? "" : timeHours}
                    onChange={(e) =>
                      setTimeHours(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    placeholder="e.g. 0.5"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time impact included in cost calculations (e.g. setup or service time per job).
                  </p>
                </div>
              </>
            )}
            {category === "HARDWARE" && (
              <div>
                <Label>Type</Label>
                <select
                  value={hardwareType}
                  onChange={(e) => {
                    setHardwareType(e.target.value);
                    setPrinterSubType("");
                  }}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {HARDWARE_TYPES.map((opt) => (
                    <option key={opt.value || "generic"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {category === "HARDWARE" && isLF && (
              <div>
                <Label>Sub-type</Label>
                <select
                  value={printerSubType}
                  onChange={(e) => setPrinterSubType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {LARGE_FORMAT_SUB_TYPES.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {category === "HARDWARE" && is3D && (
              <div>
                <Label>Sub-type</Label>
                <select
                  value={printerSubType}
                  onChange={(e) => setPrinterSubType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {THREE_D_SUB_TYPES.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {category === "HARDWARE" && isLF && (
              <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
                <div>
                  <Label>Model</Label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Max print width (m)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={maxPrintWidthM === "" ? "" : maxPrintWidthM}
                    onChange={(e) => setMaxPrintWidthM(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Print speed (m²/hr)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={printSpeedSqmPerHour === "" ? "" : printSpeedSqmPerHour}
                    onChange={(e) => setPrintSpeedSqmPerHour(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Setup time (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.05}
                    value={setupTimeHours === "" ? "" : setupTimeHours}
                    onChange={(e) => setSetupTimeHours(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Lifespan (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={lifespanHours === "" ? "" : lifespanHours}
                    onChange={(e) => setLifespanHours(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Annual maintenance (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={annualMaintenanceKes === "" ? "" : annualMaintenanceKes}
                    onChange={(e) => setAnnualMaintenanceKes(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Power (W)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={powerWatts === "" ? "" : powerWatts}
                    onChange={(e) => setPowerWatts(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Electricity (KES/kWh)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={electricityRateKesKwh === "" ? "" : electricityRateKesKwh}
                    onChange={(e) => setElectricityRateKesKwh(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            {category === "HARDWARE" && is3D && (
              <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
                <div>
                  <Label>Power (W)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={powerWatts === "" ? "" : powerWatts}
                    onChange={(e) => setPowerWatts(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Electricity (KES/kWh)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={electricityRateKesKwh === "" ? "" : electricityRateKesKwh}
                    onChange={(e) => setElectricityRateKesKwh(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Lifespan (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={lifespanHours === "" ? "" : lifespanHours}
                    onChange={(e) => setLifespanHours(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Maintenance per year (KES)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={maintenancePerYearKes === "" ? "" : maintenancePerYearKes}
                    onChange={(e) => setMaintenancePerYearKes(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Post-processing time (hours)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={postProcessingTimeHours === "" ? "" : postProcessingTimeHours}
                    onChange={(e) => setPostProcessingTimeHours(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add item"}
            </Button>
          </form>
        )}
        {filteredList.length > 0 && (
          <TableToolbar
            searchPlaceholder="Search hardware..."
            searchValue={url.q}
            onSearch={url.setSearch}
            filters={filters}
            sortOptions={[{ label: "Name", value: "name" }, { label: "Price", value: "priceKes" }, { label: "Lifespan", value: "lifespanHours" }]}
            currentSort={url.sort || "name"}
            currentSortDir={url.dir}
            onSortChange={url.setSort}
            totalCount={filteredList.length}
            filteredCount={filteredAndSorted.length}
            onClearFilters={url.clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-medium">Name</th>
                  {category === "HARDWARE" && (
                    <>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Sub-type</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Location</th>
                      <th className="text-right p-2 font-medium">Lifespan (hrs)</th>
                      <th className="text-right p-2 font-medium">Cost/hr</th>
                      <th className="text-right p-2 font-medium">Maintenance/yr (KES)</th>
                      <th className="text-right p-2 font-medium">Power (W)</th>
                    </>
                  )}
                  {(category === "MAINTENANCE" || category === "PRINTER_ACCESSORIES") && (
                    <>
                      <th className="text-left p-2 font-medium">Printer</th>
                      <th className="text-right p-2 font-medium">Time (hrs)</th>
                    </>
                  )}
                  <th className="text-right p-2 font-medium">Price</th>
                  {category === "HARDWARE" && <th className="w-10 p-2" />}
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((i) => (
                  <tr key={i.id} className="border-b hover:bg-muted/30">
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{i.name}</span>
                        {i.source === "CORE_ASSET" && (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
                              Core Asset
                            </Badge>
                          </div>
                        )}
                      </div>
                    </td>
                    {category === "HARDWARE" && (
                      <>
                        <td className="p-2 text-muted-foreground">
                          {i.hardwareType === "LARGE_FORMAT_PRINTER"
                            ? "Large format"
                            : i.hardwareType === "THREE_D_PRINTER"
                              ? "3D printer"
                              : "—"}
                        </td>
                        <td className="p-2 text-muted-foreground">{formatSubType(i.printerSubType ?? null)}</td>
                        <td className="p-2">
                          <span className={i.isActive ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                            {i.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{i.location ?? "—"}</td>
                        <td className="p-2 text-right">
                          {i.lifespanHours != null ? i.lifespanHours.toLocaleString() : "—"}
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {costPerHourKes(i) != null ? `KES ${Math.round(costPerHourKes(i)!).toLocaleString()}/hr` : "—"}
                        </td>
                        <td className="p-2 text-right">
                          {i.annualMaintenanceKes != null || i.maintenancePerYearKes != null
                            ? formatKes(i.annualMaintenanceKes ?? i.maintenancePerYearKes ?? 0)
                            : "—"}
                        </td>
                        <td
                          className="p-2 text-right"
                          title={i.hardwareType === "THREE_D_PRINTER" && (i.powerWatts ?? 0) > 1000 ? "⚠ Power consumption seems high for this printer type. Typical Bambu Lab X1C uses ~400W. Edit to correct." : undefined}
                        >
                          {i.powerWatts != null ? i.powerWatts : "—"}
                        </td>
                    </>
                  )}
                  {(category === "MAINTENANCE" || category === "PRINTER_ACCESSORIES") && (
                    <>
                      <td className="p-2 text-muted-foreground">{getPrinterName(i.linkedPrinterId)}</td>
                      <td className="p-2 text-right">{i.timeHours != null ? i.timeHours : "—"}</td>
                    </>
                  )}
                  <td className="p-2 text-right">{formatKes(i.priceKes)}</td>
                  {category === "HARDWARE" && (
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const printerId = i.source === "CORE_ASSET" ? i.id : getPrinterIdByName(i.name);
                              if (printerId) router.push(`/admin/inventory/hardware/printers/${printerId}`);
                              else router.push("/admin/inventory/hardware/printers");
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View details</span>
                          </DropdownMenuItem>
                          
                          {i.source === "INVENTORY" && (
                            <DropdownMenuItem onClick={() => setEditItem(i)} className="flex items-center gap-2 cursor-pointer">
                              <Pencil className="h-4 w-4" />
                              <span>Edit hardware</span>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const printerId = i.source === "CORE_ASSET" ? i.id : getPrinterIdByName(i.name);
                              if (printerId) router.push(`/admin/inventory/hardware/printers/${printerId}?tab=maintenance`);
                              else router.push("/admin/inventory/hardware/printers");
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Wrench className="h-4 w-4" />
                            <span>Log maintenance</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const printerId = i.source === "CORE_ASSET" ? i.id : getPrinterIdByName(i.name);
                              if (printerId) router.push(`/admin/inventory/hardware/printers/${printerId}?tab=history`);
                              else router.push("/admin/inventory/hardware/printers");
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <History className="h-4 w-4" />
                            <span>View history</span>
                          </DropdownMenuItem>
                          
                          {i.source === "INVENTORY" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteItem(i)}
                                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete hardware</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSorted.length === 0 && (
          <TableEmptyState
            icon={category === "MAINTENANCE" ? Wrench : category === "PRINTER_ACCESSORIES" ? Puzzle : Search}
            title={
              category === "MAINTENANCE"
                ? "No maintenance logs yet"
                : category === "PRINTER_ACCESSORIES"
                  ? "No accessories added yet"
                  : hasActiveFilters
                    ? "No items match your filters"
                    : "No items yet"
            }
            description={
              category === "MAINTENANCE"
                ? "Log your first maintenance event from a hardware item."
                : category === "PRINTER_ACCESSORIES"
                  ? undefined
                  : hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Add one above to get started."
            }
            actionLabel={hasActiveFilters ? "Clear filters" : category === "PRINTER_ACCESSORIES" ? "Add Accessory" : "Add item"}
            onAction={hasActiveFilters ? url.clearFilters : () => setShowAddForm(true)}
          />
        )}
      </CardContent>
    </Card>

    {editItem && (
      <EditHardwareItemModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={handleEditSaved}
      />
    )}
    {deleteItem && (
      <DeleteHardwareItemModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={() => { setItems((prev) => prev.filter((i) => i.id !== deleteItem.id)); setDeleteItem(null); }}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
      />
    )}
    </>
  );
}

function EditHardwareItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: HardwareItemSerialized;
  onClose: () => void;
  onSaved: (updated: HardwareItemSerialized) => void;
}) {
  const [name, setName] = useState(item.name);
  const [priceKes, setPriceKes] = useState<number | "">(item.priceKes);
  const [location, setLocation] = useState(item.location ?? "");
  const [hardwareType, setHardwareType] = useState(item.hardwareType ?? "");
  const [printerSubType, setPrinterSubType] = useState(item.printerSubType ?? "");
  const [model, setModel] = useState(item.model ?? "");
  const [maxPrintWidthM, setMaxPrintWidthM] = useState<number | "">(item.maxPrintWidthM ?? "");
  const [printSpeedSqmPerHour, setPrintSpeedSqmPerHour] = useState<number | "">(item.printSpeedSqmPerHour ?? "");
  const [setupTimeHours, setSetupTimeHours] = useState<number | "">(item.setupTimeHours ?? "");
  const [lifespanHours, setLifespanHours] = useState<number | "">(item.lifespanHours ?? "");
  const [annualMaintenanceKes, setAnnualMaintenanceKes] = useState<number | "">(item.annualMaintenanceKes ?? "");
  const [powerWatts, setPowerWatts] = useState<number | "">(item.powerWatts ?? "");
  const [electricityRateKesKwh, setElectricityRateKesKwh] = useState<number | "">(item.electricityRateKesKwh ?? 24);
  const [maintenancePerYearKes, setMaintenancePerYearKes] = useState<number | "">(item.maintenancePerYearKes ?? "");
  const [postProcessingTimeHours, setPostProcessingTimeHours] = useState<number | "">(item.postProcessingTimeHours ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const body: any = {
        name: name.trim(),
        priceKes: Number(priceKes),
        location: location.trim() || null,
        hardwareType: hardwareType || null,
        printerSubType: printerSubType || null,
        model: model.trim() || null,
        maxPrintWidthM: maxPrintWidthM === "" ? null : Number(maxPrintWidthM),
        printSpeedSqmPerHour: printSpeedSqmPerHour === "" ? null : Number(printSpeedSqmPerHour),
        setupTimeHours: setupTimeHours === "" ? null : Number(setupTimeHours),
        lifespanHours: lifespanHours === "" ? null : Number(lifespanHours),
        annualMaintenanceKes: annualMaintenanceKes === "" ? null : Number(annualMaintenanceKes),
        powerWatts: powerWatts === "" ? null : Number(powerWatts),
        electricityRateKesKwh: electricityRateKesKwh === "" ? null : Number(electricityRateKesKwh),
        maintenancePerYearKes: maintenancePerYearKes === "" ? null : Number(maintenancePerYearKes),
        postProcessingTimeHours: postProcessingTimeHours === "" ? null : Number(postProcessingTimeHours),
      };

      const res = await fetch(`/api/admin/inventory/hardware-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      const updated = await res.json();
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const isLF = hardwareType === "LARGE_FORMAT_PRINTER";
  const is3D = hardwareType === "THREE_D_PRINTER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-bold text-gray-900 border-b pb-2">Edit hardware item</h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Price (KES)</Label>
            <Input type="number" min={0} value={priceKes} onChange={(e) => setPriceKes(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Hardware Type</Label>
            <select
              value={hardwareType}
              onChange={(e) => {
                setHardwareType(e.target.value);
                setPrinterSubType("");
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {HARDWARE_TYPES.map((opt) => (
                <option key={opt.value || "generic"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          
          {(isLF || is3D) && (
            <div>
              <Label>Sub-type</Label>
              <select
                value={printerSubType}
                onChange={(e) => setPrinterSubType(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {(isLF ? LARGE_FORMAT_SUB_TYPES : THREE_D_SUB_TYPES).map((opt) => (
                  <option key={opt.value || "none"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLF && (
          <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
             <div className="sm:col-span-2 text-xs font-semibold uppercase text-muted-foreground">Technical Specs — Large Format</div>
             <div>
               <Label>Model</Label>
               <Input value={model} onChange={(e) => setModel(e.target.value)} className="mt-1" />
             </div>
             <div>
               <Label>Max print width (m)</Label>
               <Input type="number" step={0.01} value={maxPrintWidthM} onChange={(e) => setMaxPrintWidthM(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Print speed (m²/hr)</Label>
               <Input type="number" value={printSpeedSqmPerHour} onChange={(e) => setPrintSpeedSqmPerHour(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Setup time (hours)</Label>
               <Input type="number" step={0.05} value={setupTimeHours} onChange={(e) => setSetupTimeHours(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Lifespan (hours)</Label>
               <Input type="number" value={lifespanHours} onChange={(e) => setLifespanHours(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Annual maintenance (KES)</Label>
               <Input type="number" value={annualMaintenanceKes} onChange={(e) => setAnnualMaintenanceKes(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Power (W)</Label>
               <Input type="number" value={powerWatts} onChange={(e) => setPowerWatts(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Electricity (KES/kWh)</Label>
               <Input type="number" value={electricityRateKesKwh} onChange={(e) => setElectricityRateKesKwh(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
          </div>
        )}

        {is3D && (
          <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
             <div className="sm:col-span-2 text-xs font-semibold uppercase text-muted-foreground">Technical Specs — 3D Printing</div>
             <div>
               <Label>Power (W)</Label>
               <Input type="number" value={powerWatts} onChange={(e) => setPowerWatts(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Electricity (KES/kWh)</Label>
               <Input type="number" value={electricityRateKesKwh} onChange={(e) => setElectricityRateKesKwh(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Lifespan (hours)</Label>
               <Input type="number" value={lifespanHours} onChange={(e) => setLifespanHours(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Maintenance per year (KES)</Label>
               <Input type="number" value={maintenancePerYearKes} onChange={(e) => setMaintenancePerYearKes(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Post-processing time (hours)</Label>
               <Input type="number" step={0.1} value={postProcessingTimeHours} onChange={(e) => setPostProcessingTimeHours(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
             </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
        <div className="flex gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white flex-1">{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </div>
    </div>
  );
}

function DeleteHardwareItemModal({
  item,
  onClose,
  onDeleted,
  deleting,
  onConfirm,
}: {
  item: HardwareItemSerialized;
  onClose: () => void;
  onDeleted: () => void;
  deleting: boolean;
  onConfirm: () => void;
}) {
  const handleDelete = async () => {
    try {
      await onConfirm();
      onDeleted();
      onClose();
    } catch {
      // onConfirm sets deleting false in finally
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="font-bold text-gray-900">Delete hardware item</h2>
        <p className="text-sm text-gray-600">Deactivate <strong>{item.name}</strong>? It will be hidden from the list but not permanently removed.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-1">{deleting ? "Deactivating..." : "Deactivate"}</Button>
        </div>
      </div>
    </div>
  );
}
