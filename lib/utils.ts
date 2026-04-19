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

/**
 * Fixes ALL CAPS names and descriptions to be more human-friendly.
 * If more than 50% of the string is uppercase, it converts it to sentence case.
 */
export function formatDescription(text: string | null | undefined): string {
  if (!text) return "";
  
  // Simple heuristic: if most chars are uppercase, it's probably an import/legacy data issue
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const alphaCount = (text.match(/[a-z]/i) || []).length;
  
  if (alphaCount > 5 && upperCount / alphaCount > 0.6) {
    return text.toLowerCase().split('. ').map(s => capitalizeSentence(s)).join('. ');
  }
  
  return text;
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
  if (typeof obj === 'object' && (obj as any).d && (obj as any).s !== undefined && (obj as any).e !== undefined) {
    return Number(obj) as unknown as T;
  }

  // Handle plain Objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeDecimal((obj as any)[key]);
      }
    }
    return result as T;
  }

  // Return primitives
  return obj;
}
