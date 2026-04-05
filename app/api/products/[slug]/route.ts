import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        productImages: { orderBy: { sortOrder: "asc" } },
        variants: true,
        mockups: { where: { status: "APPROVED" } },   // MED-1: Filter out pending/rejected AI mockups
        videos: { where: { status: "APPROVED" } },    // MED-1: Filter out pending/rejected AI videos
      },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ...product,
      basePrice: Number(product.basePrice),
      comparePrice: product.comparePrice != null ? Number(product.comparePrice) : null,
      weight: product.weight != null ? Number(product.weight) : null,
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
      })),
    });
  } catch (e) {
    console.error("Product API error:", e);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
