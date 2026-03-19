import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function effectivePrice(item: {
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  availableMaterials: { priceModifierKes: number | null; isDefault: boolean }[];
}): number | null {
  const base = item.priceOverrideKes ?? item.basePriceKes;
  if (base == null) return null;
  const defaultMat = item.availableMaterials.find((m) => m.isDefault);
  const modifier = defaultMat?.priceModifierKes ?? 0;
  return base + modifier;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await prisma.catalogueItem.findFirst({
      where: { slug, status: CatalogueStatus.LIVE },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        designer: { select: { id: true, name: true, username: true, platform: true, profileUrl: true } },
        photos: { orderBy: { sortOrder: "asc" } },
        availableMaterials: { where: { isAvailable: true }, orderBy: { isDefault: "desc" } },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const fromPriceKes = effectivePrice(item);
    return NextResponse.json({
      ...item,
      fromPriceKes,
    });
  } catch (e) {
    console.error("Catalogue item error:", e);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}
