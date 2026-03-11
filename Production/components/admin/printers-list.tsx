"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type PrinterRow = {
  id: string;
  name: string;
  assetTag: string | null;
  printerType: string;
  status: string;
  location: string | null;
  purchasePriceKes: number;
  hoursUsedTotal: number | null;
  expectedLifespanHours: number | null;
  remainingLifespanHours: number | null;
  depreciationPerHourKes: number | null;
  maintenancePerHourKes: number | null;
  electricityPerHourKes: number | null;
  totalMachinePerHourKes: number | null;
  nextScheduledMaintDate: string | null;
  source: "PrinterAsset" | "InventoryHardwareItem";
};

function formatKes(n: number) {
  return `KES ${Math.round(n).toLocaleString()}`;
}

export function PrintersList({
  assets,
  inventoryPrinters,
}: {
  assets: PrinterRow[];
  inventoryPrinters: PrinterRow[];
}) {
  const all = [...assets, ...inventoryPrinters];
  const largeFormat = all.filter((p) => p.printerType === "LARGE_FORMAT");
  const threeD = all.filter((p) => p.printerType !== "LARGE_FORMAT");

  const PrinterCard = ({ p }: { p: PrinterRow }) => (
    <Link href={p.source === "PrinterAsset" ? `/admin/inventory/hardware/printers/${p.id}` : "#"}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium flex items-center gap-2">
                {p.name}
                {p.assetTag && (
                  <span className="text-xs text-muted-foreground font-normal">{p.assetTag}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {p.printerType === "LARGE_FORMAT" ? "Large format" : p.printerType}
                {p.location && ` · ${p.location}`}
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                p.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : p.status === "IN_MAINTENANCE"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {p.status}
            </span>
          </div>
          {p.source === "PrinterAsset" && p.expectedLifespanHours != null && p.remainingLifespanHours != null && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Lifespan</span>
                <p className="font-medium">
                  {p.hoursUsedTotal != null ? p.hoursUsedTotal.toLocaleString() : 0} / {p.expectedLifespanHours.toLocaleString()} hrs
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-0.5">
                  <div
                    className="bg-primary h-1.5 rounded-full"
                    style={{
                      width: `${p.expectedLifespanHours > 0 ? Math.min(100, (100 * (p.expectedLifespanHours - p.remainingLifespanHours)) / p.expectedLifespanHours) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Cost/hr</span>
                <p className="font-medium">
                  {p.totalMachinePerHourKes != null ? formatKes(p.totalMachinePerHourKes) : "—"}
                </p>
              </div>
            </div>
          )}
          {p.source === "InventoryHardwareItem" && (
            <p className="text-sm text-muted-foreground mt-2">Purchase: {formatKes(p.purchasePriceKes)}</p>
          )}
          {p.source === "PrinterAsset" && p.nextScheduledMaintDate && (
            <p className="text-xs text-amber-600 mt-2">
              Next maintenance: {new Date(p.nextScheduledMaintDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8">
      {largeFormat.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Large format printers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {largeFormat.map((p) => (
              <PrinterCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
      {threeD.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">3D printers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {threeD.map((p) => (
              <PrinterCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
      {all.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No printers registered yet.</p>
            <Link href="/admin/inventory/hardware/printers/new" className="text-primary hover:underline mt-2 inline-block">
              Register your first printer
            </Link>
            <p className="text-sm mt-4">
              Or add printers from Inventory → Hardware tab (simpler list; full asset tracking here).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
