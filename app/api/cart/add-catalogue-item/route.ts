import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogueStatus } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  catalogueItemId: z.string().min(1),
  materialCode: z.string().min(1),
  colourHex: z.string().min(1),
  quantity: z.number().int().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { catalogueItemId, materialCode, colourHex, quantity } = parsed.data;

    const item = await prisma.catalogueItem.findFirst({
      where: { id: catalogueItemId, status: CatalogueStatus.LIVE },
      include: {
        category: { select: { name: true } },
        photos: { where: { isPrimary: true }, take: 1 },
        availableMaterials: { where: { isAvailable: true, materialCode } },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Catalogue item not found or not available" }, { status: 404 });
    }

    const materialOption = item.availableMaterials[0];
    const colours = Array.isArray(materialOption?.availableColours)
      ? (materialOption.availableColours as string[])
      : [];
    if (!materialOption || (colours.length > 0 && !colours.includes(colourHex))) {
      return NextResponse.json(
        { error: "Selected material or colour is not available for this item" },
        { status: 400 }
      );
    }

    const baseKes = item.priceOverrideKes ?? item.basePriceKes;
    if (baseKes == null) {
      return NextResponse.json({ error: "Item has no price set" }, { status: 400 });
    }
    const unitPriceKes = Math.round(baseKes + (materialOption.priceModifierKes ?? 0));
    const qty = Math.max(item.minQuantity, Math.min(item.maxQuantity, quantity));

    const primaryPhoto = item.photos[0];
    return NextResponse.json({
      cartItem: {
        type: "CATALOGUE" as const,
        catalogueItemId: item.id,
        name: item.name,
        slug: item.slug,
        imageUrl: primaryPhoto?.url ?? null,
        materialCode: materialOption.materialCode,
        materialName: materialOption.materialName,
        colourHex,
        colourName: colourHex,
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
