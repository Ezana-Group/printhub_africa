import { prisma } from "@/lib/prisma";

const AUTO_SKU_PREFIX = "PRD";
const AUTO_SKU_PAD = 5;

/**
 * Generate the next unique auto-SKU for a product (e.g. PRD-00001, PRD-00002).
 * Uses the highest existing numeric suffix among products with SKU matching PRD-<digits>.
 */
export async function generateNextProductSku(): Promise<string> {
  const products = await prisma.product.findMany({
    where: { sku: { not: null } },
    select: { sku: true },
  });
  let maxNum = 0;
  const re = new RegExp(`^${AUTO_SKU_PREFIX}-(\\d+)$`);
  for (const p of products) {
    if (!p.sku) continue;
    const m = p.sku.trim().match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > maxNum) maxNum = n;
    }
  }
  const next = maxNum + 1;
  const sku = `${AUTO_SKU_PREFIX}-${String(next).padStart(AUTO_SKU_PAD, "0")}`;
  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) return generateNextProductSku();
  return sku;
}
