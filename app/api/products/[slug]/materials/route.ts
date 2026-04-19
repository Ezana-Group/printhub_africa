import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const linkedMaterials = await prisma.productPrintMaterial.findMany({
      where: { productId: product.id },
      include: {
        consumable: {
          select: {
            id: true,
            name: true, // e.g. PETG, PLA
            kind: true, // e.g. FILAMENT
            brand: true,
            quantity: true, // Inventory
            colourHex: true,
            specification: true,
          },
        },
      },
      orderBy: {
        consumable: { name: "asc" },
      },
    });

    // Transform data for the frontend
    // Group by material name (PETG, PLA, etc.)
    const grouped = linkedMaterials.reduce((acc, item) => {
      const { consumable, isDefault } = item;
      if (!consumable) return acc;

      const groupName = consumable.name || "Material";
      if (!acc[groupName]) {
        acc[groupName] = {
          name: groupName,
          kind: consumable.kind,
          isDefaultGroup: false,
          options: [],
          _seenOptionIds: new Set<string>(), // Track unique options in this group
        };
      }

      if (isDefault) acc[groupName].isDefaultGroup = true;

      // Deduplicate: Don't add the same color/consumable twice to the same group
      if (acc[groupName]._seenOptionIds.has(consumable.id)) return acc;
      acc[groupName]._seenOptionIds.add(consumable.id);

      // IMPROVED: Derive a better option name (Colour Name)
      let optionName = consumable.specification || consumable.brand || groupName;
      
      if (optionName.toLowerCase().includes("kg") || optionName.toLowerCase().includes("g")) {
          const match = optionName.match(/^([a-zA-Z+/ ]+)\s+\d+/i);
          if (match) optionName = match[1].trim();
      }

      if (optionName === groupName && consumable.brand) {
          optionName = `${consumable.brand} ${groupName}`;
      }

      acc[groupName].options.push({
        id: consumable.id,
        name: optionName,
        brand: consumable.brand,
        colorHex: consumable.colourHex,
        quantity: consumable.quantity,
        isDefaultOption: isDefault,
      });

      return acc;
    }, {} as Record<string, any>);

    // Remove the tracking sets before sending response
    const result = Object.values(grouped).map(({ _seenOptionIds, ...rest }: any) => rest);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Fetch product materials error:", e);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
