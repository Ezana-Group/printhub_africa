import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getBaseUrl, 
  getProductImageUrl, 
  AVAILABILITY_MAP 
} from "@/lib/marketing/feed-utils";

/**
 * GET /api/products/tiktok
 * TikTok Catalog Feed (JSON)
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const products = await prisma.product.findMany({
      where: { 
        isActive: true, 
        exportToTiktok: true 
      },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });

    const items = products.map((p) => {
      const imageUrl = getProductImageUrl(p as any, baseUrl);

      // TikTok specific availability mapping
      const tiktokAvailability = p.availability === "IN_STOCK" || p.availability === "PRINT_ON_DEMAND"
        ? "IN_STOCK"
        : p.availability === "PRE_ORDER"
          ? "AVAILABLE_FOR_ORDER"
          : "OUT_OF_STOCK";

      return {
        sku_id: p.id,
        title: p.name,
        description: p.description || p.shortDescription || p.name,
        price: Number(p.basePrice),
        currency: "KES",
        availability: tiktokAvailability,
        condition: "NEW",
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        brand: p.brand || "PrintHub Africa",
        category: p.category.name,
        mpn: p.sku || p.id,
        gtin: "", 
      };
    });

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("TikTok Feed Error:", error);
    return NextResponse.json({ error: "Failed to generate TikTok feed" }, { status: 500 });
  }
}
