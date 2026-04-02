import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { ProductAvailability } from "@prisma/client";

/**
 * GET /api/products/feed
 * Universal Product Feed for Meta, Pinterest, and general use (JSON)
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

      const additionalImages = imgs
        .filter((img) => img.id !== featured?.id)
        .slice(0, 10)
        .map((img) => img.url.startsWith("http") ? img.url : img.storageKey ? safePublicFileUrl(img.storageKey) : null)
        .filter(Boolean) as string[];

      const availabilityMap: Record<ProductAvailability, string> = {
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
        price: `${Number(p.basePrice)} KES`,
        sale_price: p.comparePrice ? `${Number(p.comparePrice)} KES` : undefined,
        availability: availabilityMap[p.availability] || "in stock",
        condition: "new",
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        additional_image_links: additionalImages,
        brand: p.brand || "PrintHub",
        category: p.category.name,
        gtin: "",
        mpn: p.sku || p.id,
        currency: "KES",
      };
    });

    return NextResponse.json({
      title: "PrintHub Universal Product Feed",
      link: baseUrl,
      generatedAt: new Date().toISOString(),
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
