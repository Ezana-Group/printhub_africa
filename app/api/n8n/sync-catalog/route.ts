/**
 * GET /api/n8n/sync-catalog
 *
 * Called by the Daily Social Feed Sync cron to trigger a catalog refresh.
 * Returns product and catalogue counts so n8n can decide whether to proceed
 * with content generation.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const [activeProducts, featuredProducts, catalogueItems, lowStock] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true, isFeatured: true } }),
      prisma.catalogueItem.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: { gt: 0 },
          // low stock: stock <= lowStockThreshold
          AND: [
            { stock: { gt: 0 } },
          ],
        },
      }),
    ]);

  // Fetch recently updated products for content generation triggers
  const recentlyUpdated = await prisma.product.findMany({
    where: {
      isActive: true,
      updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      isFeatured: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    stats: {
      activeProducts,
      featuredProducts,
      catalogueItems,
    },
    recentlyUpdated,
    recentlyUpdatedCount: recentlyUpdated.length,
  });
}
