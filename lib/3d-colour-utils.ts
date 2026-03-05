/**
 * Shared colour pills and mapping for 3D print calculator (customer, admin, sales).
 * Used so material/colour UI is consistent and brand colour (#E8440A) is fixed.
 */

export const BRAND_COLOUR_HEX = "#E8440A";

export const COLOUR_PILLS: { id: string; label: string; bg: string; border?: string; pattern?: boolean }[] = [
  { id: "White", label: "White", bg: "#ffffff", border: "#CBD5E0" },
  { id: "Black", label: "Black", bg: "#1A1A1A" },
  { id: "Red", label: "Red", bg: "#EF4444" },
  { id: "Blue", label: "Blue", bg: "#3B82F6" },
  { id: "Green", label: "Green", bg: "#22C55E" },
  { id: "Yellow", label: "Yellow", bg: "#EAB308" },
  { id: "Orange", label: "Orange", bg: "#F97316" },
  { id: "Grey", label: "Grey", bg: "#6B7280" },
  { id: "Brown", label: "Brown", bg: "#92400E" },
  { id: "Pink", label: "Pink", bg: "#EC4899" },
  { id: "Navy", label: "Navy", bg: "#1E3A5F" },
  { id: "Natural/Transparent", label: "Natural/Transparent", bg: "transparent", border: "#9ca3af", pattern: true },
];

/** Map colour name (e.g. "White", "Black") to hex for display. Uses COLOUR_PILLS; fallback #6B7280. */
export function colourNameToHex(name: string | undefined): string {
  if (!name || !name.trim()) return "#6B7280";
  const pill = COLOUR_PILLS.find((p) => p.id.toLowerCase() === name.trim().toLowerCase());
  if (pill) return pill.bg === "transparent" ? pill.border ?? "#9ca3af" : pill.bg;
  return "#6B7280";
}

/** Map inventory specification (e.g. "White 1kg", "Matte Black") to canonical pill id. */
export function canonicalColorFromSpec(spec: string | undefined): string {
  if (!spec || !spec.trim()) return "Natural/Transparent";
  const trimmed = spec.trim();
  const lower = trimmed.toLowerCase();
  if (["clear", "natural", "transparent", "transparency"].some((x) => lower.includes(x))) return "Natural/Transparent";
  const firstWord = trimmed.split(/\s+/)[0] ?? trimmed;
  const match = COLOUR_PILLS.find((p) => p.id.toLowerCase() === firstWord.toLowerCase());
  if (match) return match.id;
  const contained = COLOUR_PILLS.find((p) => lower.includes(p.id.toLowerCase()));
  if (contained) return contained.id;
  return trimmed;
}

export function colorMatches(apiColor: string | undefined, pillId: string): boolean {
  const canon = canonicalColorFromSpec(apiColor);
  if (pillId === "Natural/Transparent") return canon === "Natural/Transparent";
  return canon.toLowerCase() === pillId.toLowerCase();
}

export const PREFERRED_MATERIAL_ORDER = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Resin"];
