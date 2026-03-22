/**
 * GET /api/feeds/products
 * Product feed for channel integrations (Google Merchant Center, Meta Catalog, TikTok Shop, etc.).
 * Returns JSON array of shop products + catalogue items with id, title, description, link, image, price, availability.
 * Use this URL in each platform's "scheduled fetch" or "data source" setup.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { CatalogueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function getBaseUrl(req: Request): string {
  try {
    const u = new URL(req.url);
    return u.origin;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  }
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const [products, catalogueItems] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: { select: { name: true, slug: true } },
          productImages: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      }),
      prisma.catalogueItem.findMany({
        where: { status: CatalogueStatus.LIVE },
        include: {
          category: { select: { name: true, slug: true } },
          photos: { where: { isPrimary: true }, take: 1 },
        },
      }),
    ]);

    const shopEntries = products.map((p) => {
      const img = p.productImages?.[0];
      const imageUrl =
        (p.images?.[0]?.startsWith("http") ? p.images[0] : null)
        ?? (img?.storageKey ? safePublicFileUrl(img.storageKey) : null)
        ?? img?.url
        ?? null;
      return {
        id: `shop-${p.id}`,
        title: p.name,
        description: p.shortDescription ?? p.description ?? p.name,
        link: `${baseUrl}/shop/${p.slug}`,
        imageLink: imageUrl,
        price: `${Number(p.basePrice)} KES`,
        availability: (p.stock ?? 0) > 0 ? "in_stock" : "out_of_stock",
        brand: "PrintHub",
        channel: "shop",
      };
    });

    const catalogueEntries = catalogueItems.map((item) => {
      const photo = item.photos[0];
      const imageUrl =
        photo?.url?.startsWith("http")
          ? photo.url
          : photo?.storageKey
            ? safePublicFileUrl(photo.storageKey)
            : null;
      const priceKes = item.priceOverrideKes ?? item.basePriceKes;
      return {
        id: `catalogue-${item.id}`,
        title: item.name,
        description: item.shortDescription ?? item.description ?? item.name,
        link: `${baseUrl}/catalogue/${item.slug}`,
        imageLink: imageUrl,
        price: priceKes != null ? `${Math.round(priceKes)} KES` : null,
        availability: "in_stock",
        brand: "PrintHub",
        channel: "catalogue",
      };
    });

    const feed = {
      version: "1.0",
      baseUrl,
      generatedAt: new Date().toISOString(),
      items: [...shopEntries, ...catalogueEntries],
    };

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    console.error("Product feed error:", e);
    return NextResponse.json(
      { error: "Failed to generate feed" },
      { status: 500 }
    );
  }
}
