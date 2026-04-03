import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        totalViews: { increment: 1 },
        weeklyViews: { increment: 1 },
      },
      select: { id: true, totalViews: true, weeklyViews: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error("[product-view]", err);
    return NextResponse.json({ error: "Failed to log view" }, { status: 500 });
  }
}
