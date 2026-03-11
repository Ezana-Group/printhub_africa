/**
 * Human-readable labels for quote specification codes (3D print, etc.).
 * Use everywhere these values are displayed in admin — quote detail, list, reports.
 */

export const FINISHING_LABELS: Record<string, string> = {
  FINISH_RAW: "Raw (no finishing)",
  FINISH_SANDED: "Sanded",
  FINISH_PAINTED: "Painted",
  FINISH_PRIMED: "Primed",
  FINISH_SMOOTHED: "Smoothed",
};

export const SUPPORT_REMOVAL_LABELS: Record<string, string> = {
  NONE: "None",
  SUP_RM_NONE: "None",
  SUP_RM_BASIC: "Basic supports",
  SUP_RM_FULL: "Full support removal",
};

export const TURNAROUND_LABELS: Record<string, string> = {
  STD_3D: "Standard (3–5 business days)",
  EXPRESS_3D: "Express (1–2 business days)",
  URGENT_3D: "Urgent (next day)",
};

export function finishingLabel(code: string | undefined): string {
  if (!code) return "";
  return FINISHING_LABELS[code] ?? code;
}

export function supportRemovalLabel(code: string | undefined): string {
  if (!code) return "";
  return SUPPORT_REMOVAL_LABELS[code] ?? code;
}

export function turnaroundLabel(code: string | undefined): string {
  if (!code) return "";
  return TURNAROUND_LABELS[code] ?? code;
}
