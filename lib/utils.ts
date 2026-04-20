import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format amount as KES (always "KES" label, not locale symbol e.g. KSh). */
export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPhoneKenya(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
  return `+254${cleaned}`;
}

export function capitalizeSentence(s: string): string {
  if (!s) return "";
  const lowered = s.toLowerCase();
  return lowered.charAt(0).toUpperCase() + lowered.slice(1);
}

/** Remove basic HTML tags from rich text content. */
export function stripHtmlTags(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

/** Convert rich HTML/plain text into clean readable paragraphs. */
export function toParagraphs(text: string | null | undefined): string[] {
  const cleaned = stripHtmlTags(text);
  if (!cleaned) return [];
  return cleaned
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Fixes ALL CAPS names and descriptions to be more human-friendly.
 * If more than 50% of the string is uppercase, it converts it to sentence case.
 */
export function formatDescription(text: string | null | undefined): string {
  const cleaned = stripHtmlTags(text);
  if (!cleaned) return "";
  
  // Simple heuristic: if most chars are uppercase, it's probably an import/legacy data issue
  const upperCount = (cleaned.match(/[A-Z]/g) || []).length;
  const alphaCount = (cleaned.match(/[a-z]/i) || []).length;
  
  if (alphaCount > 5 && upperCount / alphaCount > 0.6) {
    return cleaned.toLowerCase().split('. ').map(s => capitalizeSentence(s)).join('. ');
  }
  
  return cleaned;
}

/**
 * Recursively converts Prisma Decimal objects to numbers.
 * This is required when passing objects from Server Components to Client Components
 * because Next.js serialization does not support the Decimal.js object.
 */
export function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDecimal(item)) as unknown as T;
  }

  // Handle Decimal.js objects (they usually have a "d" and "s" and "e" property or an isDecimal flag)
  if (
    typeof obj === "object" &&
    obj !== null &&
    "d" in (obj as Record<string, unknown>) &&
    "s" in (obj as Record<string, unknown>) &&
    "e" in (obj as Record<string, unknown>)
  ) {
    return Number(obj) as unknown as T;
  }

  // Handle plain Objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const source = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = serializeDecimal(source[key]);
      }
    }
    return result as unknown as T;
  }

  // Return primitives
  return obj;
}
