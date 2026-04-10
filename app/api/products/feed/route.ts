import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getBaseUrl, 
  getProductImageUrl, 
  AVAILABILITY_MAP 
} from "@/lib/marketing/feed-utils";

/**
 * GET /api/products/feed
 * Universal Product Feed for Meta, Pinterest, and general use (JSON)
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const platformParam = req.nextUrl.searchParams.get("platform")?.toLowerCase();

    let platformFilter = {};
    if (platformParam === "google") platformFilter = { exportToGoogle: true };
    else if (platformParam === "meta") platformFilter = { exportToMeta: true };
    else if (platformParam === "tiktok") platformFilter = { exportToTiktok: true };
    else if (platformParam === "linkedin") platformFilter = { exportToLinkedIn: true };
    else if (platformParam === "pinterest") platformFilter = { exportToPinterest: true };
    else if (platformParam === "x") platformFilter = { exportToX: true };
    else if (platformParam === "google-business") platformFilter = { exportToGoogleBiz: true };

    const products = await prisma.product.findMany({
      where: { 
        isActive: true, 
        ...platformFilter 
      },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });

    const items = products.map((p) => {
      const imageUrl = getProductImageUrl(p as any, baseUrl);

      const additionalImages = (p.productImages ?? [])
        .slice(1, 11)
        .map((img) => getProductImageUrl({ ...p, productImages: [img] } as any, baseUrl))
        .filter((url) => url !== imageUrl);

      const availability = AVAILABILITY_MAP[p.availability] || "in stock";

      return {
        id: `shop-${p.id}`,
        title: p.name,
        description: p.description || p.shortDescription || p.name,
        price: `${Number(p.basePrice)} KES`,
        sale_price: p.comparePrice ? `${Number(p.comparePrice)} KES` : undefined,
        availability,
        condition: "new",
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        additional_image_links: additionalImages,
        brand: p.brand || "PrintHub Africa",
        category: p.category.name,
        gtin: "",
        mpn: p.sku || p.id,
        currency: "KES",
      };
    });

    return NextResponse.json({
      title: `PrintHub ${platformParam ? platformParam.toUpperCase() + " " : ""}Product Feed`,
      link: baseUrl,
      platform: platformParam || "universal",
      generatedAt: new Date().toISOString(),
      itemCount: items.length,
      items,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Universal Feed Error:", error);
    return NextResponse.json({ error: "Failed to generate universal feed" }, { status: 500 });
  }
}
