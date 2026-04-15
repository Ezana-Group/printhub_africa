/**
 * GET /api/n8n/weekly-featured-products
 *
 * Returns featured products for the weekly SMS broadcast workflow (AI-12).
 * Rotates selection weekly so the same products aren't sent repeatedly.
 *
 * Auth: none enforced (public product data) — but n8n workflows do send
 * x-printhub-signature for consistency so we validate it anyway.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  // Weekly rotation: use ISO week number as deterministic seed
  const now = new Date();
  const weekOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
      (7 * 24 * 60 * 60 * 1000)
  );

  const featured = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      comparePrice: true,
      shortDescription: true,
      images: true,
      tags: true,
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  // Deterministic weekly rotation using week number as offset
  const rotated = [...featured].sort(() => 0);
  const offset = weekOfYear % Math.max(1, featured.length);
  const weeklySlice = [
    ...rotated.slice(offset, offset + 5),
    ...rotated.slice(0, Math.max(0, 5 - (rotated.length - offset))),
  ].slice(0, 5);

  // Also include products with active sale prices (compare > base)
  const onSale = await prisma.product.findMany({
    where: {
      isActive: true,
      comparePrice: { not: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      comparePrice: true,
      shortDescription: true,
      category: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    weekNumber: weekOfYear,
    featured: weeklySlice,
    onSale,
    fetchedAt: now.toISOString(),
  });
}
