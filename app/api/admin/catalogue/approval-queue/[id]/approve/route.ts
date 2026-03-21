import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (auth.session.user as any).id;

  try {
    const item = await prisma.catalogueItem.findUnique({ 
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: "asc" } }
      }
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Generate unique SKU
    const { generateNextProductSku } = await import("@/lib/product-utils");
    const sku = await generateNextProductSku(item.categoryId);

    // Create or find Product
    let productId = item.productId;
    if (!productId) {
      const product = await prisma.product.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          shortDescription: item.shortDescription,
          categoryId: item.categoryId,
          productType: "READYMADE_3D",
          images: item.photos.length > 0 ? item.photos.map(p => p.url) : [],
          basePrice: item.priceOverrideKes ?? item.basePriceKes ?? 0,
          comparePrice: item.priceOverrideKes && item.basePriceKes ? item.basePriceKes : null,
          sku: sku,
          stock: 0,
          isActive: true,
          tags: item.tags || [],
        }
      });
      productId = product.id;
    }

    const updated = await prisma.catalogueItem.update({
      where: { id },
      data: {
        status: CatalogueStatus.LIVE,
        approvedById: userId,
        approvedAt: new Date(),
        rejectedById: null,
        rejectionReason: null,
        productId: productId,
      },
    });

    await writeAudit({
      action: "CATALOGUE_ITEM_APPROVE",
      category: "CATALOGUE",
      userId: userId,
      entityId: id,
      details: `Approved item: ${item.name}. Created product with SKU: ${sku}`,
    });

    revalidateTag("catalogue");
    revalidatePath("/catalogue");
    if (updated.slug) revalidatePath(`/catalogue/${updated.slug}`);

    return NextResponse.json({ success: true, status: "LIVE", sku });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_APPROVE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
