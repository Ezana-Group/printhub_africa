"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type Machine = {
  id: string;
  name: string;
  _count?: { maintenanceLogs?: number; productionJobs?: number };
};

export function DeleteHardwareModal({
  machine,
  open,
  onClose,
  onDeleted,
}: {
  machine: Machine | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const hasProductionHistory = (machine?._count?.productionJobs ?? 0) > 0;
  const hasMaintenanceHistory = (machine?._count?.maintenanceLogs ?? 0) > 0;
  const hasHistory = hasProductionHistory || hasMaintenanceHistory;

  const handleDelete = async () => {
    if (!machine) return;
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${machine.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setConfirming(false);
    }
  };

  const handleRetire = async () => {
    if (!machine) return;
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${machine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETIRED" }),
      });
      if (!res.ok) throw new Error("Failed to retire");
      onDeleted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to retire");
    }
  };

  if (!open || !machine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Hardware</h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{machine.name}</strong>?
        </p>
        {hasHistory ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">This machine has existing records</p>
            <ul className="text-sm text-amber-700 space-y-1">
              {hasProductionHistory && <li>• {machine._count?.productionJobs} production job(s) linked</li>}
              {hasMaintenanceHistory && <li>• {machine._count?.maintenanceLogs} maintenance log(s) will be deleted</li>}
            </ul>
            <p className="text-xs text-amber-600 mt-2">
              <strong>Recommended:</strong> Set status to &quot;Retired&quot; instead to preserve history.
            </p>
            <button type="button" onClick={handleRetire} className="mt-3 w-full py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-medium hover:bg-amber-200">
              Retire instead (recommended)
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">This machine will be permanently deleted.</p>
        )}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={confirming} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-red-600">
            {confirming ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
