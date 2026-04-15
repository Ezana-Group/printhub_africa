/**
 * GET /api/n8n/get-weekly-deals
 *
 * Returns products with active promotional pricing for the weekly SMS
 * broadcast and social media deal-post workflows.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  // Products with a compare price higher than base = on sale
  const deals = await prisma.product.findMany({
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
      images: true,
      tags: true,
      availability: true,
      category: { select: { name: true } },
      productImages: {
        where: { isPrimary: true },
        select: { url: true, storageKey: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const enriched = deals.map((p) => {
    const base = Number(p.basePrice);
    const compare = Number(p.comparePrice ?? base);
    const savingPercent =
      compare > base ? Math.round(((compare - base) / compare) * 100) : 0;

    return {
      ...p,
      savingPercent,
      savingKes: compare > base ? Number((compare - base).toFixed(2)) : 0,
      primaryImage: p.productImages[0]?.url ?? (p.images[0] ?? null),
      productUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/products/${p.slug}`,
    };
  });

  // Sort by biggest saving first
  enriched.sort((a, b) => b.savingPercent - a.savingPercent);

  return NextResponse.json({
    deals: enriched,
    total: enriched.length,
    fetchedAt: new Date().toISOString(),
  });
}
