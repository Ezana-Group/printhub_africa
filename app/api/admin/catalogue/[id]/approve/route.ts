import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const { id } = await ctx.params;

  const item = await prisma.catalogueItem.findUnique({
    where: { id },
    include: { photos: { where: { isPrimary: true }, take: 1 } }
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== CatalogueStatus.PENDING_REVIEW) {
    return NextResponse.json(
      { error: "Item is not pending review" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    status: CatalogueStatus.LIVE,
    approvedById: userId,
    approvedAt: new Date(),
    rejectedById: null,
    rejectionReason: null,
  };

  // 1. Create or Find Product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let productId = (item as any).productId;
  if (!productId) {
    const slug = item.slug;
    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: slug,
        description: item.description,
        shortDescription: item.shortDescription,
        categoryId: item.categoryId,
        productType: "READYMADE_3D",
        images: item.photos.length > 0 ? item.photos.map(p => p.url) : [],
        basePrice: item.priceOverrideKes ?? item.basePriceKes ?? 0,
        comparePrice: item.priceOverrideKes && item.basePriceKes ? item.basePriceKes : null,
        stock: 0,
        isActive: true,
        tags: item.tags,
      }
    });
    productId = product.id;
    data.productId = productId;
  } else {
    // Ensure product is active
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: true }
    });
  }

  const itemAfter = await prisma.catalogueItem.update({
    where: { id },
    data,
    select: { slug: true },
  });
  revalidateTag("catalogue");
  revalidateTag("products"); // Revalidate products for the shop
  revalidatePath("/catalogue");
  revalidatePath("/shop"); // Revalidate shop
  if (itemAfter.slug) revalidatePath(`/catalogue/${itemAfter.slug}`);
  return NextResponse.json({ success: true, status: "LIVE", productId });
}
