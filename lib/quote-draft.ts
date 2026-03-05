/**
 * Draft payload sent from admin quote calculator to /admin/quotes/new.
 * Stored in sessionStorage so the new quote page can pre-fill and generate PDF.
 */
export const QUOTE_DRAFT_STORAGE_KEY = "printhub_quote_draft";

export type QuoteDraft3D = {
  type: "3d";
  clientName: string;
  validUntil: string;
  lines: Array<{
    description: string;
    materialCode: string;
    color: string;
    weightGrams: number;
    printTimeHours: number;
    quantity: number;
    postProcessing: boolean;
    marginPercentOverride?: number;
  }>;
  globalMarginPercent: number;
  discountType: "kes" | "percent";
  discountValue: number;
  discountReason: string;
};

export type QuoteDraftLF = {
  type: "large_format";
  clientName: string;
  validUntil: string;
  lines: Array<{
    description: string;
    widthCm: number;
    heightCm: number;
    materialCode: string;
    laminationCode: string;
    quantity: number;
    eyelets: "NONE" | "STANDARD" | "HEAVY";
    hemming: "NONE" | "ALL_4" | "TOP_BOTTOM";
    marginPercentOverride?: number;
  }>;
  globalMarginPercent: number;
  discountKes: number;
};

export type QuoteDraft = QuoteDraft3D | QuoteDraftLF;

export function getQuoteDraft(): QuoteDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(QUOTE_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuoteDraft;
    if (parsed.type !== "3d" && parsed.type !== "large_format") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuoteDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(QUOTE_DRAFT_STORAGE_KEY);
}

export function setQuoteDraft(draft: QuoteDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(QUOTE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}
