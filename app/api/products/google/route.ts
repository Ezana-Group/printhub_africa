import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import { 
  getBaseUrl, 
  escapeXml, 
  getProductImageUrl, 
  AVAILABILITY_MAP 
} from "@/lib/marketing/feed-utils";

/**
 * GET /api/products/google
 * Google Merchant Center Feed (XML/RSS)
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const products = await prisma.product.findMany({
      where: { 
        isActive: true, 
        OR: [
          { exportToGoogle: true },
          { exportToGoogleBiz: true },
          { exportToGoogleDiscover: true },
          { exportToGoogleMapsPost: true }
        ]
      },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });

    const items = products.map((p) => {
      const imageUrl = getProductImageUrl(p as any, baseUrl);

      const additionalImages = (p.productImages ?? [])
        .slice(1, 11) // skip primary, take up to 10 more
        .map((img) => {
          const url = (img.url && img.url.startsWith("http")) 
            ? img.url 
            : img.storageKey ? safePublicFileUrl(img.storageKey) : null;
          return url ? `<g:additional_image_link>${escapeXml(url)}</g:additional_image_link>` : "";
        })
        .filter(Boolean)
        .join("\n");

      // Map local category to Google's taxonomy or fallback
      const googleCategory = "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Mixed Media";

      const availability = AVAILABILITY_MAP[p.availability] || "in stock";

      return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description || p.shortDescription || p.name)}</g:description>
      <g:link>${baseUrl}/shop/${p.slug}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      ${additionalImages}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
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
