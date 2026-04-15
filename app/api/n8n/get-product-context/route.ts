/**
 * GET /api/n8n/get-product-context?productId=<id>
 *
 * Called by AI social-media and ad-copy generation workflows to fetch
 * full product details before generating content.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId")?.trim();

  if (!productId) {
    return NextResponse.json({ error: "productId query param required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      basePrice: true,
      comparePrice: true,
      images: true,
      tags: true,
      materials: true,
      colors: true,
      finishes: true,
      isFeatured: true,
      isActive: true,
      availability: true,
      category: { select: { id: true, name: true, slug: true } },
      productImages: {
        where: { isPrimary: true },
        select: { storageKey: true, url: true },
        take: 1,
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const primaryImage = product.productImages[0];

  return NextResponse.json({
    ...product,
    image_key: primaryImage?.storageKey ?? null,
    image_url: primaryImage?.url ?? (product.images[0] ?? null),
    // exportFlags: null unless set by a future feature
    exportFlags: null,
    video_url: null,
  });
}
