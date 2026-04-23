/**
 * GET /pinterest-feed
 * Pinterest Product Feed
 * Returns CSV in Pinterest catalog format for all active products.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";

    // Query all active products exported to Pinterest
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        exportToPinterest: true,
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
        link: `${baseUrl}/shop/${p.slug}`,
        image_link: imageUrl,
        price: `${Number(p.basePrice || 0)} KES`,
        availability: (p.stock ?? 0) > 0 ? "in stock" : (p.isPOD ? "in stock" : "out of stock"),
        condition: "new",
        product_type: p.category?.name || "3D Printing",
      };
    }).filter(Boolean);

    // Generate CSV
    const csvHeader = "id,title,description,link,image_link,price,availability,condition,product_type\n";
    const csvBody = csvRows.map(row => 
      `"${row!.id}","${(row!.title).replace(/"/g, '""')}","${(row!.description).replace(/"/g, '""')}","${row!.link}","${row!.image_link}","${row!.price}","${row!.availability}","${row!.condition}","${row!.product_type}"`
    ).join('\n');

    const csv = csvHeader + csvBody;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Pinterest Feed] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}