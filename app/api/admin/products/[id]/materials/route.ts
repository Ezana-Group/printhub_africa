import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

const updateSchema = z.object({
  materials: z.array(z.object({
    consumableId: z.string(),
    isDefault: z.boolean().default(false),
  })),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const materials = await prisma.productPrintMaterial.findMany({
      where: { productId: id },
      include: {
        consumable: {
          select: {
            id: true,
            name: true,
            kind: true,
            brand: true,
            colourHex: true,
          }
        }
      }
    });
    return NextResponse.json(materials);
  } catch (e) {
    console.error("Fetch product materials error:", e);
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { materials } = parsed.data;

    await prisma.$transaction(async (tx) => {
      // 1. Delete existing
      await tx.productPrintMaterial.deleteMany({
        where: { productId: id }
      });

      // 2. Insert new
      if (materials.length > 0) {
        await tx.productPrintMaterial.createMany({
          data: materials.map(m => ({
            productId: id,
            consumableId: m.consumableId,
            isDefault: m.isDefault,
          }))
        });
      }
    });

    revalidateTag("products");
    revalidatePath(`/shop/[slug]`, "page");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Update product materials error:", e);
    return NextResponse.json({ error: "Failed to update materials" }, { status: 500 });
  }
}
