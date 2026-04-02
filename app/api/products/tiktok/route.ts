import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { ProductAvailability } from "@prisma/client";

/**
 * GET /api/products/tiktok
 * TikTok Catalog Feed (JSON)
 */

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
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });

    const items = products.map((p) => {
      const imgs = p.productImages ?? [];
      const featured = imgs.find((i) => i.isPrimary) ?? imgs[0];
      const rawImage = p.images?.[0] ?? featured?.url ?? null;
      const imageUrl =
        rawImage && rawImage.startsWith("http")
          ? rawImage
          : featured?.storageKey
            ? safePublicFileUrl(featured.storageKey)
            : baseUrl + "/images/placeholder-product.webp";

      const availabilityMap: Record<ProductAvailability, string> = {
        IN_STOCK: "IN_STOCK",
        ON_ORDER: "OUT_OF_STOCK",
        PRE_ORDER: "AVAILABLE_FOR_ORDER",
        IMPORT_ON_REQUEST: "OUT_OF_STOCK",
        PRINT_ON_DEMAND: "IN_STOCK",
      };

      return {
        sku_id: p.id,
        title: p.name,
        description: p.description || p.shortDescription || p.name,
        price: Number(p.basePrice),
        currency: "KES",
        availability: availabilityMap[p.availability] || "IN_STOCK",
        condition: "NEW",
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        brand: p.brand || "PrintHub",
        category: p.category.name,
        mpn: p.sku || p.id,
        gtin: "", // Not currently stored
      };
    });

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("TikTok Feed Error:", error);
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 });
  }
}
