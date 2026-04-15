/**
 * GET /api/n8n/stock-levels
 *
 * Returns current stock levels for all active products.
 * Flags items that are low-stock or out-of-stock.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
      availability: true,
      category: { select: { name: true } },
    },
    orderBy: { stock: "asc" },
  });

  const enriched = products.map((p) => ({
    ...p,
    categoryName: p.category.name,
    isLowStock: p.stock > 0 && p.stock <= p.lowStockThreshold,
    isOutOfStock: p.stock === 0,
  }));

  const outOfStock = enriched.filter((p) => p.isOutOfStock);
  const lowStock = enriched.filter((p) => p.isLowStock);

  return NextResponse.json({
    total: enriched.length,
    outOfStockCount: outOfStock.length,
    lowStockCount: lowStock.length,
    outOfStock,
    lowStock,
    all: enriched,
    fetchedAt: new Date().toISOString(),
  });
}
