import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";

const createSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  location: z.string().max(200).optional(),
  unitCostKes: z.number().min(0).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "inventory_edit" });
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { productId, quantity, lowStockThreshold = 5, location, unitCostKes } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { productType: true },
  });
  if (!product || product.productType !== "LARGE_FORMAT") {
    return NextResponse.json(
      { error: "Product must be a large format product" },
      { status: 400 }
    );
  }

  try {
    const inventory = await prisma.inventory.create({
      data: {
        productId,
        quantity,
        lowStockThreshold,
        location: location || null,
        unitCostKes: unitCostKes ?? null,
      },
      include: { product: true },
    });
    return NextResponse.json(inventory);
  } catch (e) {
    console.error("Inventory create error:", e);
    return NextResponse.json(
      { error: "Failed to create inventory" },
      { status: 500 }
    );
  }
}
