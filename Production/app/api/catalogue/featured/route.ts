import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function effectivePrice(item: {
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  availableMaterials: { priceModifierKes: number; isDefault: boolean }[];
}): number | null {
  const base = item.priceOverrideKes ?? item.basePriceKes;
  if (base == null) return null;
  const defaultMat = item.availableMaterials.find((m) => m.isDefault);
  const modifier = defaultMat?.priceModifierKes ?? 0;
  return base + modifier;
}

export async function GET() {
  try {
    const items = await prisma.catalogueItem.findMany({
      where: { status: CatalogueStatus.LIVE, isFeatured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        category: { select: { name: true, slug: true } },
        photos: { orderBy: { sortOrder: "asc" }, take: 3 },
        availableMaterials: { where: { isAvailable: true }, select: { materialName: true, priceModifierKes: true, isDefault: true } },
      },
    });
    const list = items.map((item) => {
      const primaryPhoto = item.photos.find((p) => p.isPrimary) ?? item.photos[0];
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        category: item.category,
        primaryPhotoUrl: primaryPhoto?.url ?? null,
        fromPriceKes: effectivePrice(item),
      };
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("Catalogue featured error:", e);
    return NextResponse.json(
      { error: "Failed to fetch featured items" },
      { status: 500 }
    );
  }
}
