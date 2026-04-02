import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { ProductAvailability } from "@prisma/client";

/**
 * GET /api/products/google
 * Google Merchant Center Feed (XML/RSS)
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

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
        .map((img) => {
          const url = (img.url && img.url.startsWith("http")) ? img.url : img.storageKey ? safePublicFileUrl(img.storageKey) : null;
          return url ? `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>` : "";
        })
        .join("\n");

      const availabilityMap = {
        IN_STOCK: "in stock",
        ON_ORDER: "out of stock",
        PRE_ORDER: "preorder",
        IMPORT_ON_REQUEST: "out of stock",
        PRINT_ON_DEMAND: "in stock",
      };

      // Map local category to Google's taxonomy or fallback
      const googleCategory = p.category.name.toLowerCase().includes("3d") 
        ? "Toys & Games > Toys > Specialized Toys > 3D Printers" 
        : "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Printing & Printmaking";

      return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description || p.shortDescription || p.name)}</g:description>
      <g:link>${baseUrl}/shop/${p.slug}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      ${additionalImages}
      <g:condition>new</g:condition>
      <g:availability>${availabilityMap[p.availability] || "in stock"}</g:availability>
      <g:price>${Number(p.basePrice)} KES</g:price>
      ${p.comparePrice ? `<g:sale_price>${Number(p.comparePrice)} KES</g:sale_price>` : ""}
      <g:brand>${escapeXml(p.brand || "PrintHub Africa")}</g:brand>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(p.category.name)}</g:product_type>
      <g:shipping>
        <g:country>KE</g:country>
        <g:service>Standard</g:service>
        <g:price>0 KES</g:price>
      </g:shipping>
      <g:identifier_exists>${p.sku ? "true" : "false"}</g:identifier_exists>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ""}
    </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>PrintHub Products</title>
    <link>${baseUrl}</link>
    <description>Premium quality prints and 3D products from PrintHub Africa</description>
    <language>en-ke</language>
    ${items.join("")}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        "X-Robots-Tag": "noindex"
      },
    });
  } catch (error) {
    console.error("Google Feed Error:", error);
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 });
  }
}
