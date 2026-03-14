"use client";

const TYPE_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  SCHEDULED_SERVICE: "bg-blue-100 text-blue-800",
  PREVENTIVE: "bg-green-100 text-green-800",
  CORRECTIVE: "bg-amber-100 text-amber-800",
  BREAKDOWN_REPAIR: "bg-amber-100 text-amber-800",
  INSPECTION: "bg-slate-100 text-slate-700",
  CALIBRATION: "bg-violet-100 text-violet-800",
  CLEANING: "bg-cyan-100 text-cyan-800",
  PART_REPLACEMENT: "bg-orange-100 text-orange-800",
  EMERGENCY: "bg-red-100 text-red-800",
  UPGRADE: "bg-indigo-100 text-indigo-800",
  FIRMWARE_UPDATE: "bg-indigo-100 text-indigo-800",
};

export function MaintenanceTypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLES[type] ?? "bg-gray-100 text-gray-700";
  const label = type.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
