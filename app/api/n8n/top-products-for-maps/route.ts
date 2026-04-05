import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { weeklyViews: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        mockups: {
          where: { status: "APPROVED" },
          take: 1,
        }
      }
    });

    return NextResponse.json(products.map(p => ({
      id: p.id,
      name: p.name,
      productSlug: p.slug,
      shortDescription: p.shortDescription || "",
      approvedMockupUrl: p.mockups[0]?.imageUrl || "",
    })));
  } catch (err) {
    console.error("[top-products-for-maps]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
