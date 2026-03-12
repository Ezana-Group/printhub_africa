import { prisma } from "@/lib/prisma";

const KENYA_VAT_RATE = 0.16;

/** Order type for prefix lookup (matches Prisma OrderType enum). */
export type OrderTypeForNumber =
  | "SHOP"
  | "POD"
  | "LARGE_FORMAT"
  | "THREE_D_PRINT"
  | "QUOTE"
  | "CUSTOM_PRINT";

const DEFAULT_PREFIXES: Record<OrderTypeForNumber, string> = {
  SHOP: "PHUB",
  POD: "POD",
  LARGE_FORMAT: "LF",
  THREE_D_PRINT: "3DP",
  QUOTE: "Q",
  CUSTOM_PRINT: "CP",
};

const ORDER_TYPE_LIST: OrderTypeForNumber[] = [
  "SHOP",
  "POD",
  "LARGE_FORMAT",
  "THREE_D_PRINT",
  "QUOTE",
  "CUSTOM_PRINT",
];

/** Get prefix for an order type from admin settings (PricingConfig adminSettings:system) or defaults. */
export async function getOrderNumberPrefixes(): Promise<Record<OrderTypeForNumber, string>> {
  const row = await prisma.pricingConfig.findUnique({
    where: { key: "adminSettings:system" },
  });
  if (!row?.valueJson || typeof row.valueJson !== "string") return { ...DEFAULT_PREFIXES };
  try {
    const raw = row.valueJson.trim();
    if (!raw) return { ...DEFAULT_PREFIXES };
    const data = JSON.parse(raw) as { orderNumberPrefixes?: Partial<Record<OrderTypeForNumber, string>> };
    const custom = data.orderNumberPrefixes ?? {};
    const result = { ...DEFAULT_PREFIXES };
    for (const t of ORDER_TYPE_LIST) {
      if (typeof custom[t] === "string" && custom[t].trim()) {
        result[t] = custom[t].trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 12) || DEFAULT_PREFIXES[t];
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_PREFIXES };
  }
}

/** Generate next sequential order number for the given order type. Number part is auto-incremented. */
export async function ensureUniqueOrderNumber(orderType: OrderTypeForNumber): Promise<string> {
  const prefixes = await getOrderNumberPrefixes();
  const prefix = prefixes[orderType] || "PHUB";
  const prefixPattern = `${prefix}-`;
  const padLength = 5;

  // Find the latest order whose orderNumber starts with prefix-
  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefixPattern } },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let nextNum = 1;
  if (last) {
    const suffix = last.orderNumber.slice(prefixPattern.length);
    const n = parseInt(suffix, 10);
    if (!Number.isNaN(n) && n >= 0) nextNum = n + 1;
  }

  const candidate = `${prefixPattern}${String(nextNum).padStart(padLength, "0")}`;

  // Ensure uniqueness in case of race
  const exists = await prisma.order.findUnique({ where: { orderNumber: candidate } });
  if (exists) {
    return ensureUniqueOrderNumber(orderType);
  }
  return candidate;
}

/** @deprecated Use ensureUniqueOrderNumber(orderType) for new code. */
export function generateOrderNumber(): string {
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `PHUB-${random}`;
}

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * KENYA_VAT_RATE);
}
