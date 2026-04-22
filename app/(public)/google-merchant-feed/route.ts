/**
 * GET /google-merchant-feed
 * Google Merchant Center Product Feed
 * Returns RSS/XML in Google Shopping format for all active products.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&#39;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";

    // Query all active products exported to Google
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        exportToGoogle: true,
      },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });

    // Build feed items
    const feedItems = products.map((p) => {
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
        imageLink: imageUrl,
        price: `${Number(p.basePrice || 0).toFixed(2)} KES`,
        availability: (p.stock ?? 0) > 0 ? "in_stock" : (p.isPOD ? "in_stock" : "out_of_stock"),
      };
    }).filter(Boolean);

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>PrintHub Africa Product Feed</title>
    <link>${baseUrl}</link>
    <description>3D Printing Products for Google Merchant Center</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${feedItems.map(item => `
    <item>
      <g:id>${escapeXml(item!.id)}</g:id>
      <g:title><![CDATA[${item!.title}]]></g:title>
      <g:description><![CDATA[${item!.description}]]></g:description>
      <g:link>${escapeXml(item!.link)}</g:link>
      <g:image_link>${escapeXml(item!.imageLink!)}</g:image_link>
      <g:price>${item!.price}</g:price>
      <g:availability>${item!.availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>PrintHub Africa</g:brand>
    </item>`).join('')}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Google Merchant Feed] Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}