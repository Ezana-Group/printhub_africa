"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

type Machine = {
  id: string;
  name: string;
  hoursUsedTotal?: number | null;
};

interface LogMaintenanceModalProps {
  machine: Machine | null;
  open: boolean;
  onClose: () => void;
  onLogged: (log: unknown) => void;
}

const MAINTENANCE_TYPES = [
  { value: "SCHEDULED", label: "Scheduled service" },
  { value: "PREVENTIVE", label: "Preventive maintenance" },
  { value: "CORRECTIVE", label: "Corrective — after fault" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "CALIBRATION", label: "Calibration" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "PART_REPLACEMENT", label: "Part replacement" },
  { value: "EMERGENCY", label: "Emergency repair" },
  { value: "UPGRADE", label: "Hardware upgrade" },
  { value: "SCHEDULED_SERVICE", label: "Scheduled service (legacy)" },
  { value: "BREAKDOWN_REPAIR", label: "Breakdown repair" },
];

export function LogMaintenanceModal({ machine, open, onClose, onLogged }: LogMaintenanceModalProps) {
  const [form, setForm] = useState({
    type: "SCHEDULED",
    performedAt: new Date().toISOString().split("T")[0],
    performedBy: "",
    hoursAtService: "",
    description: "",
    labourHours: "",
    labourCostKes: "",
    nextServiceDate: "",
    nextServiceHours: "",
    notes: "",
  });

  const [parts, setParts] = useState<{ partName: string; quantity: string; unitCostKes: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (machine) {
      setForm((f) => ({
        ...f,
        hoursAtService: machine.hoursUsedTotal != null ? String(machine.hoursUsedTotal) : "",
      }));
    }
  }, [machine]);

  const addPart = () => setParts((p) => [...p, { partName: "", quantity: "1", unitCostKes: "" }]);
  const removePart = (i: number) => setParts((p) => p.filter((_, idx) => idx !== i));
  const updatePart = (i: number, field: string, value: string) =>
    setParts((p) => p.map((part, idx) => (idx === i ? { ...part, [field]: value } : part)));

  const partsCostTotal = parts.reduce((sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.unitCostKes) || 0), 0);
  const labourCost = Number(form.labourCostKes) || 0;
  const totalCost = partsCostTotal + labourCost;

  const handleSubmit = async () => {
    if (!machine) return;
    if (!form.performedBy.trim() || !form.description.trim()) {
      setError("Performed by and description are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${machine.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          date: form.performedAt,
          performedBy: form.performedBy,
          hoursAtService: form.hoursAtService ? Number(form.hoursAtService) : null,
          description: form.description,
          labourHours: form.labourHours ? Number(form.labourHours) : null,
          labourCostKes: labourCost || null,
          nextServiceDate: form.nextServiceDate || null,
          nextServiceHours: form.nextServiceHours ? Number(form.nextServiceHours) : null,
          notes: form.notes || null,
          parts: parts
            .filter((p) => p.partName.trim())
            .map((p) => ({
              partName: p.partName,
              quantity: Number(p.quantity),
              unitCostKes: Number(p.unitCostKes),
              totalCostKes: Number(p.quantity) * Number(p.unitCostKes),
            })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log maintenance");
      onLogged(data.log);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log maintenance");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !machine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Log Maintenance</h2>
            <p className="text-sm text-gray-500">{machine.name}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Maintenance type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date performed *</label>
              <input
                type="date"
                value={form.performedAt}
                onChange={(e) => setForm((f) => ({ ...f, performedAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Performed by *</label>
              <input
                type="text"
                value={form.performedBy}
                onChange={(e) => setForm((f) => ({ ...f, performedBy: e.target.value }))}
                placeholder="Staff name or tech company"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Machine hours at service</label>
              <input
                type="number"
                value={form.hoursAtService}
                onChange={(e) => setForm((f) => ({ ...f, hoursAtService: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What was done?"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Labour hours</label>
              <input
                type="number"
                step="0.5"
                value={form.labourHours}
                onChange={(e) => setForm((f) => ({ ...f, labourHours: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Labour cost (KES)</label>
              <input
                type="number"
                value={form.labourCostKes}
                onChange={(e) => setForm((f) => ({ ...f, labourCostKes: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">Parts / consumables used</label>
              <button type="button" onClick={addPart} className="flex items-center gap-1 text-xs text-[#FF4D00] hover:underline">
                <Plus className="w-3 h-3" /> Add part
              </button>
            </div>
            {parts.length === 0 && <p className="text-xs text-gray-400 py-2">No parts — click &quot;Add part&quot; to add</p>}
            {parts.map((part, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <input
                  value={part.partName}
                  onChange={(e) => updatePart(i, "partName", e.target.value)}
                  placeholder="Part name"
                  className="col-span-5 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                />
                <input
                  type="number"
                  value={part.quantity}
                  onChange={(e) => updatePart(i, "quantity", e.target.value)}
                  placeholder="Qty"
                  min={0.1}
                  step={0.1}
                  className="col-span-2 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                />
                <input
                  type="number"
                  value={part.unitCostKes}
                  onChange={(e) => updatePart(i, "unitCostKes", e.target.value)}
                  placeholder="KES/unit"
                  className="col-span-4 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                />
                <button type="button" onClick={() => removePart(i)} className="col-span-1 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(parts.length > 0 || labourCost > 0) && (
              <div className="bg-gray-50 rounded-xl p-3 mt-2 space-y-1 text-sm">
                {parts.length > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Parts cost</span>
                    <span className="font-mono">KES {partsCostTotal.toLocaleString()}</span>
                  </div>
                )}
                {labourCost > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Labour cost</span>
                    <span className="font-mono">KES {labourCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Total cost</span>
                  <span className="font-mono text-[#FF4D00]">KES {totalCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Next service date</label>
              <input
                type="date"
                value={form.nextServiceDate}
                onChange={(e) => setForm((f) => ({ ...f, nextServiceDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Next service (machine hours)</label>
              <input
                type="number"
                value={form.nextServiceHours}
                onChange={(e) => setForm((f) => ({ ...f, nextServiceHours: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Additional notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00] resize-none"
            />
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving || !form.performedBy.trim() || !form.description.trim()} className="flex-1 bg-[#FF4D00] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-[#e04400]">
            {saving ? "Saving..." : "Log Maintenance"}
          </button>
        </div>
      </div>
    </div>
  );
}
