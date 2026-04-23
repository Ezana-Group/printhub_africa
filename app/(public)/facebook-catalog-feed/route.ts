/**
 * GET /facebook-catalog-feed
 * Facebook Product Catalog Feed
 * Returns CSV in Facebook Catalog format for all active products.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";

    // Query all active products exported to Facebook
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        exportToMeta: true,
      },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });

    // Build CSV rows
    const csvRows = products.map((p) => {
      const img = p.productImages?.[0];
      let imageUrl =
        (p.images?.[0]?.startsWith("http") ? p.images[0] : null)
        ?? (img?.storageKey ? safePublicFileUrl(img.storageKey) : null)
        ?? img?.url
        ?? (p.images?.[0]?.startsWith("/") ? `${baseUrl}${p.images[0]}` : null);

      // Skip items without images
      if (!imageUrl) return null;

      return {
        id: `shop-${p.id}`,
        title: p.name || "Untitled Product",
        description: p.shortDescription || p.description || p.name || "No description available",
        availability: (p.stock ?? 0) > 0 ? "in stock" : (p.isPOD ? "in stock" : "out of stock"),
        condition: "new",
        price: `${Number(p.basePrice || 0)} KES`,
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        brand: "PrintHub Africa",
        google_product_category: "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Craft Supplies > Craft Supplies > 3D Printing",
      };
    }).filter(Boolean);

    // Generate CSV
    const csvHeader = "id,title,description,availability,condition,price,link,image_link,brand,google_product_category\n";
    const csvBody = csvRows.map(row => 
      `"${row!.id}","${(row!.title).replace(/"/g, '""')}","${(row!.description).replace(/"/g, '""')}","${row!.availability}","${row!.condition}","${row!.price}","${row!.link}","${row!.image_link}","${row!.brand}","${row!.google_product_category}"`
    ).join('\n');

    const csv = csvHeader + csvBody;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Facebook Catalog Feed] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}