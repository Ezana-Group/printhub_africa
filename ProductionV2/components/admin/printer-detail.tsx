"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TABS = ["Overview", "Specs & Costs", "Maintenance History", "Parts & Accessories", "Usage Stats"];
const MAINTENANCE_TYPES = [
  "SCHEDULED_SERVICE",
  "BREAKDOWN_REPAIR",
  "CLEANING",
  "CALIBRATION",
  "PART_REPLACEMENT",
  "FIRMWARE_UPDATE",
  "INSPECTION",
];

function formatKes(n: number) {
  return `KES ${Math.round(n).toLocaleString()}`;
}

function formatDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString() : "—";
}

type Asset = {
  id: string;
  name: string;
  assetTag: string;
  printerType: string;
  status: string;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  notes: string | null;
  purchasePriceKes: number;
  purchaseDate: string | null;
  expectedLifespanHours: number;
  hoursUsedTotal: number;
  remainingLifespanHours: number | null;
  depreciationPerHourKes: number | null;
  maintenancePerHourKes: number | null;
  electricityPerHourKes?: number;
  totalMachinePerHourKes?: number;
  annualMaintenanceKes: number;
  warrantyExpiryDate: string | null;
  nextScheduledMaintDate: string | null;
  maxPrintWidthM: number | null;
  buildVolumeX: number | null;
  buildVolumeY: number | null;
  buildVolumeZ: number | null;
  powerWatts: number;
  electricityRateKesKwh: number;
  productionSpeed: number;
  setupTimeHours: number;
  postProcessingTimeHours: number | null;
};

type Log = {
  id: string;
  type: string;
  date: string;
  performedBy: string;
  description: string;
  labourHours: number;
  labourCostKes: number;
  totalCostKes: number;
  nextServiceDate: string | null;
  notes: string | null;
};

type LinkedItem = {
  id: string;
  name: string;
  category: string;
  priceKes: number;
  timeHours: number | null;
};

export function PrinterDetail({
  asset,
  maintenanceLogs,
  linkedItems,
}: {
  asset: Asset;
  maintenanceLogs: Log[];
  linkedItems: LinkedItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [showLogForm, setShowLogForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logType, setLogType] = useState("SCHEDULED_SERVICE");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logPerformedBy, setLogPerformedBy] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [logLabourHours, setLogLabourHours] = useState<number | "">(0);
  const [logLabourCostKes, setLogLabourCostKes] = useState<number | "">(0);
  const [logNextServiceDate, setLogNextServiceDate] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${asset.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: logType,
          date: logDate,
          performedBy: logPerformedBy.trim() || undefined,
          description: logDescription.trim() || "Maintenance",
          labourHours: Number(logLabourHours) || 0,
          labourCostKes: Number(logLabourCostKes) || 0,
          nextServiceDate: logNextServiceDate || undefined,
          notes: logNotes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to log maintenance");
      setShowLogForm(false);
      setLogDescription("");
      setLogLabourHours(0);
      setLogLabourCostKes(0);
      setLogNextServiceDate("");
      setLogNotes("");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lifespanPct =
    asset.expectedLifespanHours > 0 && asset.remainingLifespanHours != null
      ? (100 * (asset.expectedLifespanHours - asset.remainingLifespanHours)) / asset.expectedLifespanHours
      : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{asset.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{asset.location ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer / Model</p>
                <p className="font-medium">{[asset.manufacturer, asset.model].filter(Boolean).join(" / ") || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serial</p>
                <p className="font-medium">{asset.serialNumber ?? "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Lifespan used</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, lifespanPct)}%` }}
                  />
                </div>
                <span className="text-sm whitespace-nowrap">
                  {asset.hoursUsedTotal.toLocaleString()} / {asset.expectedLifespanHours.toLocaleString()} hrs
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Remaining: {asset.remainingLifespanHours != null ? asset.remainingLifespanHours.toLocaleString() : "—"} hrs
              </p>
            </div>
            {asset.nextScheduledMaintDate && (
              <p className="text-sm">
                Next scheduled maintenance: <strong>{formatDate(asset.nextScheduledMaintDate)}</strong>
              </p>
            )}
            {asset.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{asset.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Specs & costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Technical specs</h3>
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                {asset.maxPrintWidthM != null && (
                  <>
                    <dt className="text-muted-foreground">Max print width</dt>
                    <dd>{asset.maxPrintWidthM} m</dd>
                  </>
                )}
                {(asset.buildVolumeX != null || asset.buildVolumeY != null || asset.buildVolumeZ != null) && (
                  <>
                    <dt className="text-muted-foreground">Build volume</dt>
                    <dd>{[asset.buildVolumeX, asset.buildVolumeY, asset.buildVolumeZ].filter(Boolean).join(" × ")} mm</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Power</dt>
                <dd>{asset.powerWatts} W</dd>
                <dt className="text-muted-foreground">Electricity rate</dt>
                <dd>{asset.electricityRateKesKwh} KES/kWh</dd>
                <dt className="text-muted-foreground">Production speed</dt>
                <dd>{asset.productionSpeed} {asset.printerType === "LARGE_FORMAT" ? "sqm/hr" : "cm³/hr"}</dd>
                <dt className="text-muted-foreground">Setup time</dt>
                <dd>{asset.setupTimeHours} hrs</dd>
                {asset.postProcessingTimeHours != null && (
                  <>
                    <dt className="text-muted-foreground">Post-processing</dt>
                    <dd>{asset.postProcessingTimeHours} hrs</dd>
                  </>
                )}
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Financial</h3>
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                <dt className="text-muted-foreground">Purchase price</dt>
                <dd>{formatKes(asset.purchasePriceKes)}</dd>
                <dt className="text-muted-foreground">Purchase date</dt>
                <dd>{formatDate(asset.purchaseDate)}</dd>
                <dt className="text-muted-foreground">Annual maintenance</dt>
                <dd>{formatKes(asset.annualMaintenanceKes)}</dd>
                <dt className="text-muted-foreground">Warranty expiry</dt>
                <dd>{formatDate(asset.warrantyExpiryDate)}</dd>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Cost per hour (for quotes)</h3>
              <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                <dt className="text-muted-foreground">Depreciation</dt>
                <dd>{asset.depreciationPerHourKes != null ? formatKes(asset.depreciationPerHourKes) : "—"}</dd>
                <dt className="text-muted-foreground">Maintenance</dt>
                <dd>{asset.maintenancePerHourKes != null ? formatKes(asset.maintenancePerHourKes) : "—"}</dd>
                <dt className="text-muted-foreground">Electricity</dt>
                <dd>{asset.electricityPerHourKes != null ? formatKes(asset.electricityPerHourKes) : "—"}</dd>
                <dt className="text-muted-foreground font-medium">Total machine cost/hr</dt>
                <dd className="font-medium">{asset.totalMachinePerHourKes != null ? formatKes(asset.totalMachinePerHourKes) : "—"}</dd>
              </dl>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Maintenance history</CardTitle>
            <Button size="sm" onClick={() => setShowLogForm(!showLogForm)}>
              {showLogForm ? "Cancel" : "Log maintenance"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showLogForm && (
              <form onSubmit={handleLogMaintenance} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                    >
                      {MAINTENANCE_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Performed by</Label>
                    <Input value={logPerformedBy} onChange={(e) => setLogPerformedBy(e.target.value)} placeholder="Name" className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <Input value={logDescription} onChange={(e) => setLogDescription(e.target.value)} placeholder="What was done" className="mt-1" />
                  </div>
                  <div>
                    <Label>Labour hours</Label>
                    <Input type="number" step="0.5" value={logLabourHours} onChange={(e) => setLogLabourHours(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Labour cost (KES)</Label>
                    <Input type="number" min="0" value={logLabourCostKes} onChange={(e) => setLogLabourCostKes(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Next service date</Label>
                    <Input type="date" value={logNextServiceDate} onChange={(e) => setLogNextServiceDate(e.target.value)} className="mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Notes</Label>
                    <Input value={logNotes} onChange={(e) => setLogNotes(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save log"}</Button>
              </form>
            )}
            {maintenanceLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance logs yet.</p>
            ) : (
              <div className="space-y-2">
                {maintenanceLogs.map((log) => (
                  <div key={log.id} className="flex flex-wrap items-start justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{log.type.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(log.date)} · {log.performedBy}</p>
                      <p className="text-sm mt-0.5">{log.description}</p>
                    </div>
                    <p className="text-sm font-medium">{formatKes(log.totalCostKes)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Parts & accessories linked to this printer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Maintenance items and printer accessories linked to this asset (from Inventory → Maintenance / Printer Accessories).
            </p>
            {linkedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No linked items. Link items in Inventory by choosing this printer in the Printer dropdown.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Name</th>
                    <th className="text-left py-2 font-medium">Category</th>
                    <th className="text-right py-2 font-medium">Time (hrs)</th>
                    <th className="text-right py-2 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedItems.map((i) => (
                    <tr key={i.id} className="border-b border-border">
                      <td className="py-2">{i.name}</td>
                      <td className="py-2">{i.category.replace(/_/g, " ")}</td>
                      <td className="py-2 text-right">{i.timeHours != null ? i.timeHours : "—"}</td>
                      <td className="py-2 text-right">{formatKes(i.priceKes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <dt className="text-muted-foreground">Hours used (total)</dt>
              <dd className="font-medium">{asset.hoursUsedTotal.toLocaleString()} hrs</dd>
              <dt className="text-muted-foreground">Expected lifespan</dt>
              <dd>{asset.expectedLifespanHours.toLocaleString()} hrs</dd>
              <dt className="text-muted-foreground">Remaining lifespan</dt>
              <dd>{asset.remainingLifespanHours != null ? asset.remainingLifespanHours.toLocaleString() : "—"} hrs</dd>
            </dl>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Lifespan progress</p>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, lifespanPct)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
