import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";
import { indexProducts } from "@/lib/algolia";

export async function POST() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
    });

    await indexProducts(products);

    return NextResponse.json({
      success: true,
      count: products.length,
      message: `Re-indexed ${products.length} products`,
    });
  } catch (error: any) {
    console.error("Re-index error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
