import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { generateNextProductSku } from "@/lib/product-utils";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().max(50000).optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().min(1).optional(),
  productType: z.enum(["READYMADE_3D", "LARGE_FORMAT", "CUSTOM"]).optional(),
  basePrice: z.number().min(0).optional(),
  comparePrice: z.number().min(0).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  minOrderQty: z.number().int().min(1).optional(),
  maxOrderQty: z.number().int().min(1).nullable().optional(),
  images: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  if (data.slug !== undefined) {
    const existing = await prisma.product.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: { slug: ["Slug already in use"] } }, { status: 400 });
    }
  }
  let skuUpdate: string | null | undefined = data.sku;
  if (data.sku !== undefined && (data.sku === null || (typeof data.sku === "string" && !data.sku.trim()))) {
    const categoryIdForSku =
      data.categoryId ??
      (await prisma.product.findUnique({ where: { id }, select: { categoryId: true } }))?.categoryId;
    skuUpdate = await generateNextProductSku(categoryIdForSku ?? undefined);
  } else if (data.sku !== undefined && typeof data.sku === "string" && data.sku.trim()) {
    const existingBySku = await prisma.product.findFirst({
      where: { sku: data.sku.trim(), NOT: { id } },
    });
    if (existingBySku) {
      return NextResponse.json({ error: { sku: ["SKU already in use"] } }, { status: 400 });
    }
  }
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.slug != null && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.categoryId != null && { categoryId: data.categoryId }),
        ...(data.productType != null && { productType: data.productType }),
        ...(data.basePrice != null && { basePrice: data.basePrice }),
        ...(data.comparePrice !== undefined && { comparePrice: data.comparePrice }),
        ...(skuUpdate !== undefined && { sku: skuUpdate }),
        ...(data.stock != null && { stock: data.stock }),
        ...(data.minOrderQty != null && { minOrderQty: data.minOrderQty }),
        ...(data.maxOrderQty !== undefined && { maxOrderQty: data.maxOrderQty }),
        ...(data.images != null && { images: data.images }),
        ...(data.materials != null && { materials: data.materials }),
        ...(data.colors != null && { colors: data.colors }),
        ...(data.isActive != null && { isActive: data.isActive }),
        ...(data.isFeatured != null && { isFeatured: data.isFeatured }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.tags != null && { tags: data.tags }),
      },
    });
    revalidateTag("products");
    revalidateTag("homepage");
    revalidatePath("/shop");
    revalidatePath(`/shop/${product.slug}`);
    return NextResponse.json({ product });
  } catch (e) {
    console.error("Admin update product error:", e);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_delete" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
    await prisma.product.delete({ where: { id } });
    revalidateTag("products");
    revalidateTag("homepage");
    revalidatePath("/shop");
    if (product?.slug) revalidatePath(`/shop/${product.slug}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin delete product error:", e);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
