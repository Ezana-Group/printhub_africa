"use client";

import { useState, useEffect } from "react";
import { X, Calculator } from "lucide-react";

type Machine = {
  id: string;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  status?: string;
  printerType?: string;
  maxPrintWidthM?: number | null;
  productionSpeed?: number;
  highQualitySpeed?: number | null;
  setupTimeHours?: number;
  buildVolumeX?: number | null;
  buildVolumeY?: number | null;
  buildVolumeZ?: number | null;
  postProcessingTimeHours?: number | null;
  purchasePriceKes?: number;
  purchaseDate?: string | null;
  expectedLifespanHours?: number;
  annualMaintenanceKes?: number;
  powerWatts?: number;
  warrantyExpiryDate?: string | null;
  insurancePolicyRef?: string | null;
  notes?: string | null;
  nextScheduledMaintDate?: string | null;
  maintenanceIntervalHours?: number | null;
  hoursUsedTotal?: number;
};

interface EditHardwareModalProps {
  machine: Machine | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Machine) => void;
}

export function EditHardwareModal({ machine, open, onClose, onSaved }: EditHardwareModalProps) {
  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    location: "",
    status: "ACTIVE",
    maxPrintWidthM: "",
    productionSpeed: "",
    highQualitySpeed: "",
    setupTimeHours: 0.25,
    buildVolumeX: "",
    buildVolumeY: "",
    buildVolumeZ: "",
    postProcessingTimeHours: "",
    purchasePriceKes: "",
    purchaseDate: "",
    expectedLifespanHours: "",
    annualMaintenanceKes: "",
    powerWatts: "",
    warrantyExpiryDate: "",
    insurancePolicyRef: "",
    notes: "",
    nextScheduledMaintDate: "",
    maintenanceIntervalHours: "",
    hoursUsedTotal: 0,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!machine) return;
    setForm({
      name: machine.name ?? "",
      manufacturer: machine.manufacturer ?? "",
      model: machine.model ?? "",
      serialNumber: machine.serialNumber ?? "",
      location: machine.location ?? "",
      status: machine.status ?? "ACTIVE",
      maxPrintWidthM: machine.maxPrintWidthM != null ? String(machine.maxPrintWidthM) : "",
      productionSpeed: machine.productionSpeed != null ? String(machine.productionSpeed) : "",
      highQualitySpeed: machine.highQualitySpeed != null ? String(machine.highQualitySpeed) : "",
      setupTimeHours: machine.setupTimeHours ?? 0.25,
      buildVolumeX: machine.buildVolumeX != null ? String(machine.buildVolumeX) : "",
      buildVolumeY: machine.buildVolumeY != null ? String(machine.buildVolumeY) : "",
      buildVolumeZ: machine.buildVolumeZ != null ? String(machine.buildVolumeZ) : "",
      postProcessingTimeHours: machine.postProcessingTimeHours != null ? String(machine.postProcessingTimeHours) : "",
      purchasePriceKes: machine.purchasePriceKes != null ? String(machine.purchasePriceKes) : "",
      purchaseDate: machine.purchaseDate ? new Date(machine.purchaseDate).toISOString().split("T")[0] : "",
      expectedLifespanHours: machine.expectedLifespanHours != null ? String(machine.expectedLifespanHours) : "",
      annualMaintenanceKes: machine.annualMaintenanceKes != null ? String(machine.annualMaintenanceKes) : "",
      powerWatts: machine.powerWatts != null ? String(machine.powerWatts) : "",
      warrantyExpiryDate: machine.warrantyExpiryDate ? new Date(machine.warrantyExpiryDate).toISOString().split("T")[0] : "",
      insurancePolicyRef: machine.insurancePolicyRef ?? "",
      notes: machine.notes ?? "",
      nextScheduledMaintDate: machine.nextScheduledMaintDate ? new Date(machine.nextScheduledMaintDate).toISOString().split("T")[0] : "",
      maintenanceIntervalHours: machine.maintenanceIntervalHours != null ? String(machine.maintenanceIntervalHours) : "",
      hoursUsedTotal: machine.hoursUsedTotal ?? 0,
    });
  }, [machine]);

  const depreciationPerHr = form.purchasePriceKes && form.expectedLifespanHours
    ? Math.round(Number(form.purchasePriceKes) / Number(form.expectedLifespanHours))
    : null;
  const maintenancePerHr = form.annualMaintenanceKes
    ? Math.round(Number(form.annualMaintenanceKes) / (250 * 8))
    : null;
  const electricityPerHr = form.powerWatts
    ? Math.round((Number(form.powerWatts) / 1000) * 24)
    : null;
  const totalCostPerHr = depreciationPerHr != null && maintenancePerHr != null && electricityPerHr != null
    ? depreciationPerHr + maintenancePerHr + electricityPerHr
    : null;

  const isLargeFormat = machine?.printerType === "LARGE_FORMAT";
  const is3D = machine?.printerType ? ["FDM", "RESIN"].includes(machine.printerType) : false;

  const handleSave = async () => {
    if (!machine) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${machine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          manufacturer: form.manufacturer || null,
          model: form.model || null,
          serialNumber: form.serialNumber || null,
          location: form.location || null,
          status: form.status,
          maxPrintWidthM: form.maxPrintWidthM ? Number(form.maxPrintWidthM) : null,
          productionSpeed: form.productionSpeed ? Number(form.productionSpeed) : null,
          highQualitySpeed: form.highQualitySpeed ? Number(form.highQualitySpeed) : null,
          setupTimeHours: Number(form.setupTimeHours),
          buildVolumeX: form.buildVolumeX ? Number(form.buildVolumeX) : null,
          buildVolumeY: form.buildVolumeY ? Number(form.buildVolumeY) : null,
          buildVolumeZ: form.buildVolumeZ ? Number(form.buildVolumeZ) : null,
          postProcessingTimeHours: form.postProcessingTimeHours ? Number(form.postProcessingTimeHours) : null,
          purchasePriceKes: form.purchasePriceKes ? Number(form.purchasePriceKes) : null,
          purchaseDate: form.purchaseDate || null,
          expectedLifespanHours: form.expectedLifespanHours ? Number(form.expectedLifespanHours) : null,
          annualMaintenanceKes: form.annualMaintenanceKes ? Number(form.annualMaintenanceKes) : null,
          powerWatts: form.powerWatts ? Number(form.powerWatts) : null,
          warrantyExpiryDate: form.warrantyExpiryDate || null,
          insurancePolicyRef: form.insurancePolicyRef || null,
          notes: form.notes || null,
          nextScheduledMaintDate: form.nextScheduledMaintDate || null,
          maintenanceIntervalHours: form.maintenanceIntervalHours ? Number(form.maintenanceIntervalHours) : null,
          hoursUsedTotal: Number(form.hoursUsedTotal),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onSaved(data.machine ?? data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, type = "text", step, min, suffix }: { label: string; name: keyof typeof form; type?: string; step?: string; min?: number; suffix?: string }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={form[name] as string | number}
          onChange={(e) => setForm((f) => ({ ...f, [name]: type === "number" ? (e.target.value === "" ? (name === "setupTimeHours" ? 0.25 : 0) : Number(e.target.value)) : e.target.value }))}
          step={step}
          min={min}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
        )}
      </div>
    </div>
  );

  if (!open || !machine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Edit Hardware</h2>
            <p className="text-sm text-gray-500">{machine.name}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Machine Identity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Display name *" name="name" />
              </div>
              <Field label="Manufacturer" name="manufacturer" />
              <Field label="Model" name="model" />
              <Field label="Serial number" name="serialNumber" />
              <Field label="Location" name="location" />
            </div>
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              >
                <option value="ACTIVE">Active</option>
                <option value="IDLE">Idle</option>
                <option value="IN_MAINTENANCE">In Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          {isLargeFormat && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Large Format Specs</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Max print width" name="maxPrintWidthM" type="number" step="0.01" suffix="m" />
                <Field label="Production speed" name="productionSpeed" type="number" step="0.5" suffix="sqm/hr" />
                <Field label="High quality speed" name="highQualitySpeed" type="number" step="0.5" suffix="sqm/hr" />
                <Field label="Setup time per job" name="setupTimeHours" type="number" step="0.05" suffix="hrs" />
              </div>
            </div>
          )}

          {is3D && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">3D Printer Specs</h3>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Build volume X" name="buildVolumeX" type="number" suffix="mm" />
                <Field label="Build volume Y" name="buildVolumeY" type="number" suffix="mm" />
                <Field label="Build volume Z" name="buildVolumeZ" type="number" suffix="mm" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Field label="Setup time per job" name="setupTimeHours" type="number" step="0.05" suffix="hrs" />
                <Field label="Post-processing time" name="postProcessingTimeHours" type="number" step="0.05" suffix="hrs" />
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Power & Usage</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Power consumption" name="powerWatts" type="number" suffix="W" />
              <Field label="Hours used to date" name="hoursUsedTotal" type="number" suffix="hrs" />
            </div>
            {machine.name?.toLowerCase().includes("bambu") && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Bambu Lab X1C typical power is <strong>350–400W</strong> under load. Update to <strong>400</strong> if needed.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Financial</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Purchase price" name="purchasePriceKes" type="number" suffix="KES" />
              <Field label="Purchase date" name="purchaseDate" type="date" />
              <Field label="Expected lifespan" name="expectedLifespanHours" type="number" suffix="hrs" />
              <Field label="Annual maintenance budget" name="annualMaintenanceKes" type="number" suffix="KES" />
              <Field label="Warranty expiry" name="warrantyExpiryDate" type="date" />
              <Field label="Insurance policy ref" name="insurancePolicyRef" />
            </div>
            {totalCostPerHr != null && (
              <div className="mt-4 p-4 bg-orange-50 border border-[#FF4D00]/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-[#FF4D00]" />
                  <span className="text-sm font-semibold text-gray-900">Live cost preview</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-gray-500">Depreciation</span>
                  <span className="font-mono font-medium text-right">KES {depreciationPerHr}/hr</span>
                  <span className="text-gray-500">Maintenance</span>
                  <span className="font-mono font-medium text-right">KES {maintenancePerHr}/hr</span>
                  <span className="text-gray-500">Electricity (est.)</span>
                  <span className="font-mono font-medium text-right">KES {electricityPerHr}/hr</span>
                  <span className="font-semibold text-gray-900 border-t border-[#FF4D00]/20 pt-1.5">Machine total</span>
                  <span className="font-mono font-bold text-[#FF4D00] border-t border-[#FF4D00]/20 pt-1.5 text-right">KES {totalCostPerHr}/hr</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Maintenance Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Next scheduled maintenance" name="nextScheduledMaintDate" type="date" />
              <Field label="Maintenance interval" name="maintenanceIntervalHours" type="number" suffix="hrs" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 bg-[#FF4D00] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-[#e04400]">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
