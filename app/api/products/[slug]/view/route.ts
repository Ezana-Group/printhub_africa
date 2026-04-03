import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  const resolvedParams = await (params as any);
  const identifier = resolvedParams.slug;

  try {
    // Try to update by slug first
    let product;
    try {
      product = await prisma.product.update({
        where: { slug: identifier },
        data: {
          totalViews: { increment: 1 },
          weeklyViews: { increment: 1 },
        },
        select: { id: true, totalViews: true, weeklyViews: true },
      });
    } catch (slugErr) {
      // If slug failing, try ID
      product = await prisma.product.update({
        where: { id: identifier },
        data: {
          totalViews: { increment: 1 },
          weeklyViews: { increment: 1 },
        },
        select: { id: true, totalViews: true, weeklyViews: true },
      });
    }

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error("[product-view]", err);
    return NextResponse.json({ error: "Failed to log view" }, { status: 500 });
  }
}
