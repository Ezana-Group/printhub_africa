/**
 * GET /api/n8n/top-products-for-maps
 *
 * Returns the top-selling active products with enough detail for the
 * Google Maps weekly re-post workflow to compose location-tagged content.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Aggregate order items to find top products
  const topByOrders = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ["CANCELLED"] },
      },
      productId: { not: null },
    },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 10,
  });

  const productIds = topByOrders.map((t) => t.productId).filter(Boolean) as string[];

  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            basePrice: true,
            images: true,
            tags: true,
            category: { select: { name: true } },
            productImages: {
              where: { isPrimary: true },
              select: { url: true, storageKey: true },
              take: 1,
            },
          },
        })
      : [];

  // Enrich with order count
  const enriched = productIds.map((id) => {
    const product = products.find((p) => p.id === id);
    const orderEntry = topByOrders.find((t) => t.productId === id);
    return {
      ...(product ?? { id, name: "Unknown" }),
      orderCount: orderEntry?._count.productId ?? 0,
      primaryImage:
        product?.productImages[0]?.url ??
        (product?.images[0] ?? null),
    };
  });

  return NextResponse.json({
    products: enriched,
    total: enriched.length,
    fetchedAt: new Date().toISOString(),
    businessName: "PrintHub Africa",
    location: "Nairobi, Kenya",
  });
}
