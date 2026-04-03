import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

/**
 * Returns products flagged for the weekly SMS broadcast.
 * Secured by x-printhub-signature.
 */
export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const products = await prisma.product.findMany({
      where: {
        featuredThisWeek: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        shortDescription: true,
      },
      take: 5, // Limit for SMS brevity
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[weekly-featured-products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
