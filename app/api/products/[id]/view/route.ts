import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Increment both total and weekly views
    await prisma.product.update({
      where: { id },
      data: {
        totalViews: { increment: 1 },
        weeklyViews: { increment: 1 }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[product-view-post]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
