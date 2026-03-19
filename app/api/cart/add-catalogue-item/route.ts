import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogueStatus } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  catalogueItemId: z.string().min(1),
  materialCode: z.string().optional(),
  colourHex: z.string().optional(),
  quantity: z.number().int().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { catalogueItemId, materialCode = "", colourHex = "#000000", quantity } = parsed.data;

    const item = await prisma.catalogueItem.findFirst({
      where: { id: catalogueItemId, status: CatalogueStatus.LIVE },
      include: {
        category: { select: { name: true } },
        photos: { where: { isPrimary: true }, take: 1 },
        availableMaterials: {
          where: { isAvailable: true },
          orderBy: { isDefault: "desc" },
        },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Catalogue item not found or not available" }, { status: 404 });
    }

    const baseKes = item.priceOverrideKes ?? item.basePriceKes;
    if (baseKes == null) {
      return NextResponse.json({ error: "Item has no price set" }, { status: 400 });
    }

    const hasMaterials = item.availableMaterials.length > 0;
    const materialOption = materialCode
      ? item.availableMaterials.find((m) => m.materialCode === materialCode) ?? item.availableMaterials[0]
      : item.availableMaterials[0];

    if (hasMaterials && !materialOption) {
      return NextResponse.json({ error: "No material available for this item" }, { status: 400 });
    }

    const colours = Array.isArray(materialOption?.availableColours)
      ? (materialOption.availableColours as string[])
      : [];
    const validColour = !hasMaterials || colours.length === 0 || colours.includes(colourHex);
    const finalColour = validColour ? colourHex : colours[0] ?? "#000000";

    if (hasMaterials && colours.length > 0 && !colours.includes(finalColour)) {
      return NextResponse.json(
        { error: "Selected material or colour is not available for this item" },
        { status: 400 }
      );
    }

    const unitPriceKes = Math.round(
      baseKes + (materialOption ? (materialOption.priceModifierKes ?? 0) : 0)
    );
    const qty = Math.max(item.minQuantity, Math.min(item.maxQuantity, quantity));

    const primaryPhoto = item.photos[0];
    return NextResponse.json({
      cartItem: {
        type: "CATALOGUE" as const,
        catalogueItemId: item.id,
        name: item.name,
        slug: item.slug,
        imageUrl: primaryPhoto?.url ?? null,
        materialCode: materialOption?.materialCode ?? "Default",
        materialName: materialOption?.materialName ?? "Standard",
        colourHex: finalColour,
        colourName: finalColour,
        quantity: qty,
        unitPrice: unitPriceKes,
        weightGrams: item.weightGrams ?? undefined,
        printTimeHours: item.printTimeHours ?? undefined,
      },
    });
  } catch (e) {
    console.error("Add catalogue item error:", e);
    return NextResponse.json(
      { error: "Failed to add catalogue item" },
      { status: 500 }
    );
  }
}
