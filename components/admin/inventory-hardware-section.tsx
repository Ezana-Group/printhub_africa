"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  printerAssets?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<HardwareItemSerialized[]>(initialItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const filtered = items.filter((i) => i.category === category && i.isActive);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Cancel" : "Add item"}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Name</th>
                {category === "HARDWARE" && (
                  <>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">Sub-type</th>
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-right p-2 font-medium">Lifespan (hrs)</th>
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-b hover:bg-muted/30">
                  <td className="p-2 font-medium">{i.name}</td>
                  {category === "HARDWARE" && (
                    <>
                      <td className="p-2 text-muted-foreground">
                        {i.hardwareType === "LARGE_FORMAT_PRINTER"
                          ? "Large format printer"
                          : i.hardwareType === "THREE_D_PRINTER"
                            ? "3D printer"
                            : "—"}
                      </td>
                      <td className="p-2 text-muted-foreground">{formatSubType(i.printerSubType ?? null)}</td>
                      <td className="p-2 text-muted-foreground">{i.location ?? "—"}</td>
                      <td className="p-2 text-right">
                        {i.lifespanHours != null ? i.lifespanHours.toLocaleString() : "—"}
                      </td>
                      <td className="p-2 text-right">
                        {i.annualMaintenanceKes != null || i.maintenancePerYearKes != null
                          ? formatKes(i.annualMaintenanceKes ?? i.maintenancePerYearKes ?? 0)
                          : "—"}
                      </td>
                      <td className="p-2 text-right">{i.powerWatts != null ? i.powerWatts : "—"}</td>
                    </>
                  )}
                  {(category === "MAINTENANCE" || category === "PRINTER_ACCESSORIES") && (
                    <>
                      <td className="p-2 text-muted-foreground">{getPrinterName(i.linkedPrinterId)}</td>
                      <td className="p-2 text-right">{i.timeHours != null ? i.timeHours : "—"}</td>
                    </>
                  )}
                  <td className="p-2 text-right">{formatKes(i.priceKes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No items yet. Add one above to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
