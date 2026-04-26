/**
 * Admin UI shared helpers — labels, formatting, constants.
 * printhub.africa | An Ezana Group Company
 */

export const PRODUCT_TYPE_LABELS: Record<string, { label: string; dotColor: string }> = {
  READYMADE_3D: { label: "Ready-made 3D", dotColor: "#CC3D00" },
  LARGE_FORMAT: { label: "Large Format", dotColor: "#3B82F6" },
  CUSTOM: { label: "3D Service", dotColor: "#8B5CF6" },
  PRINT_ON_DEMAND: { label: "Print-On-Demand", dotColor: "#10B981" },
  POD: { label: "Print-On-Demand", dotColor: "#10B981" },
  SERVICE: { label: "Service", dotColor: "#F59E0B" },
};

export function getProductTypeLabel(type: string): string {
  return PRODUCT_TYPE_LABELS[type]?.label ?? type;
}

export function getProductTypeDotColor(type: string): string {
  return PRODUCT_TYPE_LABELS[type]?.dotColor ?? "#6B7280";
}

/** Locale-invariant date format (DD/MM/YYYY) to avoid server/client hydration mismatch. */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Locale-invariant date+time for lists to avoid hydration mismatch. */
export function formatDateTimeForDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return formatDateForDisplay(d);
}

export function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Hash string to a hue 0–360 for avatar background */
export function nameToHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  return Math.abs(h) % 360;
}

export const STAFF_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STAFF: "Staff",
};

export function getStaffRoleLabel(role: string): string {
  return STAFF_ROLE_LABELS[role] ?? role;
}
