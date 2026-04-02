import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

/**
 * GET /api/products/pinterest
 * Pinterest Catalog Feed (JSON)
 * Format: https://help.pinterest.com/en/business/article/before-you-begin-with-catalogs
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";
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

      const availabilityMap = {
        IN_STOCK: "in stock",
        ON_ORDER: "out of stock",
        PRE_ORDER: "preorder",
        IMPORT_ON_REQUEST: "out of stock",
        PRINT_ON_DEMAND: "in stock",
      };

      return {
        id: p.id,
        title: p.name,
        description: p.description || p.shortDescription || p.name,
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        price: `${Number(p.basePrice)} KES`,
        availability: availabilityMap[p.availability] || "in stock",
        condition: "new",
        google_product_category: p.category.name,
        brand: p.brand || "PrintHub Africa",
        item_group_id: p.categoryId,
        additional_image_link: imgs
          .filter((img) => img.id !== featured?.id)
          .slice(0, 5)
          .map((img) => (img.url && img.url.startsWith("http")) ? img.url : img.storageKey ? safePublicFileUrl(img.storageKey) : null)
          .filter(Boolean),
      };
    });

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        "X-Robots-Tag": "noindex"
      },
    });
  } catch (error) {
    console.error("Pinterest Feed Error:", error);
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 });
  }
}
