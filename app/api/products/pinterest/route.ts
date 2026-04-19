import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getBaseUrl, 
  getProductImageUrl, 
  AVAILABILITY_MAP 
} from "@/lib/marketing/feed-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const products = await prisma.product.findMany({
      where: { 
        isActive: true, 
        exportToPinterest: true 
      },
      include: {
        category: { select: { name: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });

    // CSV Headers for Pinterest
    let csv = "id,title,description,availability,condition,price,link,image_link,brand\n";
    
    for (const p of products) {
      const imageUrl = getProductImageUrl(p as any, baseUrl);
      const desc = (p.description || p.shortDescription || p.name).replace(/"/g, '""');
      const title = p.name.replace(/"/g, '""');
      const availability = AVAILABILITY_MAP[p.availability] || "in stock";
      const brand = (p.brand || "PrintHub Africa").replace(/"/g, '""');
      
      csv += `"${p.id}","${title}","${desc}","${availability}","new","${Number(p.basePrice)} KES","${baseUrl}/shop/${p.slug}","${imageUrl}","${brand}"\n`;
    }

    return new NextResponse(csv, { 
      headers: { 
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="printhub-pinterest-feed.csv"',
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200"
      } 
    });
  } catch (error) {
    console.error("Pinterest Feed Error:", error);
    return NextResponse.json({ error: "Failed to generate Pinterest feed" }, { status: 500 });
  }
}
