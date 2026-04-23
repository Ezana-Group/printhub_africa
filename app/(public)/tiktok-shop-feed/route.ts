/**
 * GET /tiktok-shop-feed
 * TikTok Shop Product Feed
 * Returns CSV in TikTok Shop catalog format for all active products.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";

    // Query all active products exported to TikTok
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        exportToTiktok: true,
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
        sku_id: `shop-${p.id}`,
        title: p.name || "Untitled Product",
        description: p.shortDescription || p.description || p.name || "No description available",
        price: Number(p.basePrice || 0),
        currency: "KES",
        image_url: imageUrl,
        product_url: `${baseUrl}/shop/${p.slug}`,
        availability: (p.stock ?? 0) > 0 ? "in_stock" : (p.isPOD ? "in_stock" : "out_of_stock"),
        brand: "PrintHub Africa",
        condition: "new",
      };
    }).filter(Boolean);

    // Generate CSV
    const csvHeader = "sku_id,title,description,price,currency,image_url,product_url,availability,brand,condition\n";
    const csvBody = csvRows.map(row => 
      `"${row!.sku_id}","${(row!.title).replace(/"/g, '""')}","${(row!.description).replace(/"/g, '""')}","${row!.price}","${row!.currency}","${row!.image_url}","${row!.product_url}","${row!.availability}","${row!.brand}","${row!.condition}"`
    ).join('\n');

    const csv = csvHeader + csvBody;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[TikTok Shop Feed] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}