/**
 * GET /api/n8n/product-catalogue-summary
 *
 * Returns a concise summary of the product catalogue for AI content
 * generation workflows that need context about available products.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const [categories, featuredProducts, newArrivals, catalogStats] =
    await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
        orderBy: { sortOrder: "asc" },
      }),

      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          shortDescription: true,
          images: true,
          tags: true,
          category: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
      }),

      prisma.product.findMany({
        where: {
          isActive: true,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      prisma.product.aggregate({
        where: { isActive: true },
        _count: true,
        _min: { basePrice: true },
        _max: { basePrice: true },
        _avg: { basePrice: true },
      }),
    ]);

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    stats: {
      totalActiveProducts: catalogStats._count,
      priceRange: {
        min: catalogStats._min.basePrice,
        max: catalogStats._max.basePrice,
        avg: catalogStats._avg.basePrice,
      },
    },
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    })),
    featuredProducts,
    newArrivals,
  });
}
