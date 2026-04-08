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
  // Use public app URL if set, otherwise try to detect from request
  const fallback = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";
  try {
    const u = new URL(req.url);
    // If it's a localhost, keep it, otherwise prefer fallback
    if (u.hostname === "localhost") return u.origin;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const searchParams = req.nextUrl.searchParams;
    const isDebug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";
    const format = searchParams.get("format");

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

    // Handle Debug Mode
    if (isDebug) {
      return NextResponse.json({
        debug: true,
        summary: {
          productCount: products.length,
          catalogueCount: catalogueItems.length,
          totalCount: products.length + catalogueItems.length,
          baseUrl,
        },
        items: {
          products: products.map(p => ({ id: p.id, name: p.name, isActive: p.isActive })),
          catalogue: catalogueItems.map(c => ({ id: c.id, name: c.name, status: c.status })),
        }
      });
    }

    interface FeedItem {
      id: string;
      item_group_id?: string;
      title: string;
      description: string;
      link: string;
      imageLink: string | null;
      price: string;
      availability: string;
      brand: string;
      category: string;
    }

    // Build the standardized items list
    const feedItems: FeedItem[] = [
      ...products.map((p) => {
        const img = p.productImages?.[0];
        const imageUrl =
          (p.images?.[0]?.startsWith("http") ? p.images[0] : null)
          ?? (img?.storageKey ? safePublicFileUrl(img.storageKey) : null)
          ?? img?.url
          ?? null;
        return {
          id: `shop-${p.id}`,
          item_group_id: p.catalogueItemId ? `catalogue-${p.catalogueItemId}` : undefined,
          title: p.name || "Untitled Product",
          description: p.shortDescription || p.description || p.name || "No description available",
          link: `${baseUrl}/shop/${p.slug}`,
          imageLink: imageUrl,
          price: `${Number(p.basePrice || 0).toFixed(2)} KES`,
          availability: (p.stock ?? 0) > 0 ? "in_stock" : "out_of_stock",
          brand: p.brand || "PrintHub",
          category: "5267",
        };
      }),
      ...catalogueItems.map((item) => {
        const photo = item.photos[0];
        const imageUrl =
          photo?.url?.startsWith("http")
            ? photo.url
            : photo?.storageKey
              ? safePublicFileUrl(photo.storageKey)
              : null;
        const priceKes = item.priceOverrideKes ?? item.basePriceKes ?? 0;
        return {
          id: `catalogue-${item.id}`,
          title: item.name || "Untitled Catalogue Item",
          description: item.shortDescription || item.description || item.name || "No description available",
          link: `${baseUrl}/catalogue/${item.slug}`,
          imageLink: imageUrl,
          price: `${Math.round(priceKes)}.00 KES`,
          availability: "in_stock",
          brand: "PrintHub",
          category: "5267",
        };
      }),
    ];

    if (format === "xml" || format === "rss") {
      try {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>PrintHub Africa Product Feed</title>
    <link>${baseUrl}</link>
    <description>3D Printing Catalogue and Shop Products</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${feedItems.map(item => `
    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      ${item.item_group_id ? `<g:item_group_id>${escapeXml(item.item_group_id)}</g:item_group_id>` : ''}
      <g:title>${escapeXml(item.title)}</g:title>
      <g:description>${escapeXml(item.description)}</g:description>
      <g:link>${escapeXml(item.link)}</g:link>
      <g:image_link>${escapeXml(item.imageLink || "")}</g:image_link>
      <g:brand>${escapeXml(item.brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${item.availability}</g:availability>
      <g:price>${item.price}</g:price>
      <g:google_product_category>${item.category}</g:google_product_category>
    </item>`).join('')}
  </channel>
</rss>`;

        // Use Response for cleaner XML serialization
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "X-Feed-Items": feedItems.length.toString(),
          },
        });
      } catch (err: any) {
        console.error("[Feed] XML Template Error:", err);
        return new Response(`XML generation Error: ${err?.message}`, { 
          status: 500, 
          headers: { "Content-Type": "text/plain" } 
        });
      }
    }

    // Default JSON response
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      baseUrl,
      itemCount: feedItems.length,
      items: feedItems,
    }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e: any) {
    console.error("[Feed] Database or System Error:", e);
    return new Response(`System Error: ${e?.message || "Unknown"}`, { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}
