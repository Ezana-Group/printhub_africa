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
        product: {
          include: {
            printMaterials: {
              include: {
                consumable: {
                  select: {
                    id: true,
                    name: true,
                    colourHex: true,
                  }
                }
              }
            }
          }
        },
        podProduct: {
          include: {
            printMaterials: {
              include: {
                consumable: {
                  select: {
                    id: true,
                    name: true,
                    colourHex: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fallback: If catalogue item has no materials, try linked shop product or source POD product
    let materials = item.availableMaterials;
    const sourceProduct = item.product || item.podProduct;
    
    if (materials.length === 0 && sourceProduct?.printMaterials?.length) {
      // Group by material name (PETG, PLA)
      const grouped = (sourceProduct as any).printMaterials.reduce((acc: any, pm: any) => {
        const matName = pm.consumable.name || "PLA+";
        // Sanitize name for ID usage
        const code = matName.toUpperCase().replace(/\+/g, "PLUS").replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

        if (!acc[matName]) {
          acc[matName] = {
            id: `fb-${code}`,
            catalogueItemId: item.id,
            materialCode: code,
            materialName: matName,
            priceModifierKes: 0,
            isDefault: pm.isDefault,
            isAvailable: true,
            availableColours: [] as string[],
          };
        }
        if (pm.consumable.colourHex) {
          const hex = pm.consumable.colourHex.toLowerCase();
          if (!acc[matName].availableColours.includes(hex)) {
            acc[matName].availableColours.push(hex);
          }
        }
        if (pm.isDefault) acc[matName].isDefault = true;
        return acc;
      }, {} as Record<string, any>);
      materials = Object.values(grouped);
    }

    const fromPriceKes = effectivePrice({ ...item, availableMaterials: materials });
    
    return NextResponse.json({
      ...item,
      availableMaterials: materials,
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
