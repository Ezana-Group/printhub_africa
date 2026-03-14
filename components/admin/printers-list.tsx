"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HardwareActionsMenu } from "@/components/admin/inventory/hardware/HardwareActionsMenu";
import { EditHardwareModal } from "@/components/admin/inventory/hardware/EditHardwareModal";
import { LogMaintenanceModal } from "@/components/admin/inventory/hardware/LogMaintenanceModal";
import { DeleteHardwareModal } from "@/components/admin/inventory/hardware/DeleteHardwareModal";

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
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<PrinterRow | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = useState<PrinterRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrinterRow | null>(null);
  const [fullAssetForEdit, setFullAssetForEdit] = useState<Record<string, unknown> | null>(null);

  const all = [...assets, ...inventoryPrinters];
  const largeFormat = all.filter((p) => p.printerType === "LARGE_FORMAT");
  const threeD = all.filter((p) => p.printerType !== "LARGE_FORMAT");

  const handleEdit = async (p: PrinterRow) => {
    if (p.source !== "PrinterAsset") return;
    setEditTarget(p);
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${p.id}`);
      if (res.ok) {
        const data = await res.json();
        setFullAssetForEdit(data);
      } else {
        setFullAssetForEdit({ ...p });
      }
    } catch {
      setFullAssetForEdit({ ...p });
    }
  };

  const handleMachineUpdated = (updated: Record<string, unknown>) => {
    setFullAssetForEdit(updated);
    setEditTarget(null);
    router.refresh();
  };

  const handleToggleStatus = async (p: PrinterRow) => {
    if (p.source !== "PrinterAsset") return;
    const next = p.status === "ACTIVE" ? "IN_MAINTENANCE" : "ACTIVE";
    try {
      await fetch(`/api/admin/inventory/assets/printers/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } catch {
      // ignore
    }
  };

  const PrinterCard = ({ p }: { p: PrinterRow }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={p.source === "PrinterAsset" ? `/admin/inventory/hardware/printers/${p.id}` : "#"}
            className="min-w-0 flex-1"
          >
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
          </Link>
          <div className="flex items-center gap-1 flex-shrink-0">
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
            {p.source === "PrinterAsset" && (
              <HardwareActionsMenu
                machine={{ id: p.id, name: p.name, status: p.status }}
                onEdit={(m) => { const row = all.find((r) => r.id === m.id); if (row) void handleEdit(row); }}
                onLogMaintenance={(m) => { const row = all.find((r) => r.id === m.id); if (row) setMaintenanceTarget(row); }}
                onDelete={(m) => { const row = all.find((r) => r.id === m.id); if (row) setDeleteTarget(row); }}
                onToggleStatus={(m) => { const row = all.find((r) => r.id === m.id); if (row) void handleToggleStatus(row); }}
              />
            )}
          </div>
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

      <EditHardwareModal
        machine={(fullAssetForEdit ?? editTarget) as Parameters<typeof EditHardwareModal>[0]["machine"]}
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setFullAssetForEdit(null); }}
        onSaved={handleMachineUpdated}
      />
      <LogMaintenanceModal
        machine={maintenanceTarget}
        open={!!maintenanceTarget}
        onClose={() => setMaintenanceTarget(null)}
        onLogged={() => { setMaintenanceTarget(null); router.refresh(); }}
      />
      <DeleteHardwareModal
        machine={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => { setDeleteTarget(null); router.refresh(); }}
      />
    </div>
  );
}
