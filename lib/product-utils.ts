import { prisma } from "@/lib/prisma";

const DEFAULT_SKU_PREFIX = "PRD";
const SKU_PAD = 5;
const MAX_PREFIX_LEN = 12;

function sanitizePrefix(s: string): string {
  return s
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, MAX_PREFIX_LEN) || DEFAULT_SKU_PREFIX;
}

export type SkuPrefixConfig = {
  defaultPrefix: string;
  prefixByCategoryId: Record<string, string>;
};

/** Load SKU prefix config from admin settings (PricingConfig adminSettings:system). */
export async function getSkuPrefixConfig(): Promise<SkuPrefixConfig> {
  const row = await prisma.pricingConfig.findUnique({
    where: { key: "adminSettings:system" },
  });
  if (!row?.valueJson || typeof row.valueJson !== "string") {
    return { defaultPrefix: DEFAULT_SKU_PREFIX, prefixByCategoryId: {} };
  }
  try {
    const data = JSON.parse(row.valueJson) as {
      skuDefaultPrefix?: string;
      skuPrefixByCategoryId?: Record<string, string>;
    };
    const defaultPrefix = typeof data.skuDefaultPrefix === "string" && data.skuDefaultPrefix.trim()
      ? sanitizePrefix(data.skuDefaultPrefix)
      : DEFAULT_SKU_PREFIX;
    const prefixByCategoryId: Record<string, string> = {};
    if (data.skuPrefixByCategoryId && typeof data.skuPrefixByCategoryId === "object") {
      for (const [catId, val] of Object.entries(data.skuPrefixByCategoryId)) {
        if (typeof val === "string" && val.trim()) {
          prefixByCategoryId[catId] = sanitizePrefix(val);
        }
      }
    }
    return { defaultPrefix, prefixByCategoryId };
  } catch {
    return { defaultPrefix: DEFAULT_SKU_PREFIX, prefixByCategoryId: {} };
  }
}

/**
 * Generate the next unique auto-SKU for a product (e.g. PRD-00001, VINYL-00001).
 * Uses the prefix from settings: default or per-category override.
 * categoryId: optional; when provided, category-specific prefix is used if configured.
 */
export async function generateNextProductSku(categoryId?: string | null, overridePrefix?: string): Promise<string> {
  const { defaultPrefix, prefixByCategoryId } = await getSkuPrefixConfig();
  const prefix =
    overridePrefix || (categoryId && prefixByCategoryId[categoryId]) || defaultPrefix;

  const products = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { sku: true },
  });

  const re = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`);
  let maxNum = 0;
  for (const p of products) {
    if (!p.sku) continue;
    const m = p.sku.trim().match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  const next = maxNum + 1;
  const sku = `${prefix}-${String(next).padStart(SKU_PAD, "0")}`;
  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) return generateNextProductSku(categoryId ?? undefined);
  return sku;
}

/**
 * Generate a POD SKU: POD-[YYYYMM]-[5-digit-sequence].
 * Uses the Counter model with key "pod_sku" for atomic increment.
 */
export async function generatePODSku(): Promise<string> {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace("-", ""); // 202603

  const counter = await prisma.$transaction(async (tx) => {
    const c = await tx.counter.upsert({
      where: { id: "pod_sku" },
      update: { value: { increment: 1 } },
      create: { id: "pod_sku", value: 1 },
    });
    return c;
  });

  const sequence = String(counter.value).padStart(5, "0");
  return `POD-${yearMonth}-${sequence}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
