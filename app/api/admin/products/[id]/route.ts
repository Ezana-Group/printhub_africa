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
  productType: z.enum(["READYMADE_3D", "LARGE_FORMAT", "CUSTOM", "PRINT_ON_DEMAND", "POD", "SERVICE"]).optional(),
  isPOD: z.boolean().optional(),
  printTimeEstimate: z.string().nullable().optional(),
  filamentWeightGrams: z.number().nullable().optional(),
  basePrice: z.number().min(0).optional(),
  comparePrice: z.number().min(0).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  minOrderQty: z.number().int().min(1).optional(),
  maxOrderQty: z.number().int().min(1).nullable().optional(),
  images: z.array(z.string()).optional(),
  productionFiles: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(50)).optional(),
  featuredThisWeek: z.boolean().optional(),
  exportToGoogle: z.boolean().optional(),
  exportToGoogleBiz: z.boolean().optional(),
  exportToLinkedIn: z.boolean().optional(),
  exportToMeta: z.boolean().optional(),
  exportToPinterest: z.boolean().optional(),
  exportToTiktok: z.boolean().optional(),
  exportToX: z.boolean().optional(),
  exportToGoogleDiscover: z.boolean().optional(),
  exportToInstagramReels: z.boolean().optional(),
  exportToInstagramStories: z.boolean().optional(),
  exportToJiji: z.boolean().optional(),
  exportToTelegram: z.boolean().optional(),
  exportToWhatsappChannel: z.boolean().optional(),
  exportToWhatsappStatus: z.boolean().optional(),
  exportToYoutubeShorts: z.boolean().optional(),
  exportToAppleMaps: z.boolean().optional(),
  exportToBingPlaces: z.boolean().optional(),
  exportToGoogleMapsPost: z.boolean().optional(),
  exportToLinkedInNewsletter: z.boolean().optional(),
  exportToMedium: z.boolean().optional(),
  exportToNextdoor: z.boolean().optional(),
  exportToOlxKenya: z.boolean().optional(),
  exportToPigiaMe: z.boolean().optional(),
  exportToReddit: z.boolean().optional(),
  exportToSnapchat: z.boolean().optional(),
  exportToYoutube: z.boolean().optional(),
});

function normalizeProductType(type: z.infer<typeof updateSchema>["productType"]) {
  if (!type) return type;
  return type === "POD" ? "PRINT_ON_DEMAND" : type;
}

import { detectBackInStock } from "@/lib/marketing/back-in-stock";

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
  const normalizedProductType = normalizeProductType(data.productType);

  // --- Fetch current product for stock comparison ---
  const currentProduct = await prisma.product.findUnique({
    where: { id },
    select: { stock: true, slug: true, categoryId: true },
  });

  if (!currentProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

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
    const categoryIdForSku = data.categoryId ?? currentProduct.categoryId;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (normalizedProductType !== undefined) updateData.productType = normalizedProductType;
    if (data.isPOD !== undefined) updateData.isPOD = data.isPOD;
    if (data.printTimeEstimate !== undefined) updateData.printTimeEstimate = data.printTimeEstimate;
    if (data.filamentWeightGrams !== undefined) updateData.filamentWeightGrams = data.filamentWeightGrams;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice;
    if (skuUpdate !== undefined) updateData.sku = skuUpdate;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.minOrderQty !== undefined) updateData.minOrderQty = data.minOrderQty;
    if (data.maxOrderQty !== undefined) updateData.maxOrderQty = data.maxOrderQty;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.productionFiles !== undefined) updateData.productionFiles = data.productionFiles;
    if (data.materials !== undefined) updateData.materials = data.materials;
    if (data.colors !== undefined) updateData.colors = data.colors;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.featuredThisWeek !== undefined) updateData.featuredThisWeek = data.featuredThisWeek;
    if (data.exportToGoogle !== undefined) updateData.exportToGoogle = data.exportToGoogle;
    if (data.exportToGoogleBiz !== undefined) updateData.exportToGoogleBiz = data.exportToGoogleBiz;
    if (data.exportToLinkedIn !== undefined) updateData.exportToLinkedIn = data.exportToLinkedIn;
    if (data.exportToMeta !== undefined) updateData.exportToMeta = data.exportToMeta;
    if (data.exportToPinterest !== undefined) updateData.exportToPinterest = data.exportToPinterest;
    if (data.exportToTiktok !== undefined) updateData.exportToTiktok = data.exportToTiktok;
    if (data.exportToX !== undefined) updateData.exportToX = data.exportToX;
    if (data.exportToGoogleDiscover !== undefined) updateData.exportToGoogleDiscover = data.exportToGoogleDiscover;
    if (data.exportToInstagramReels !== undefined) updateData.exportToInstagramReels = data.exportToInstagramReels;
    if (data.exportToInstagramStories !== undefined) updateData.exportToInstagramStories = data.exportToInstagramStories;
    if (data.exportToJiji !== undefined) updateData.exportToJiji = data.exportToJiji;
    if (data.exportToTelegram !== undefined) updateData.exportToTelegram = data.exportToTelegram;
    if (data.exportToWhatsappChannel !== undefined) updateData.exportToWhatsappChannel = data.exportToWhatsappChannel;
    if (data.exportToWhatsappStatus !== undefined) updateData.exportToWhatsappStatus = data.exportToWhatsappStatus;
    if (data.exportToYoutubeShorts !== undefined) updateData.exportToYoutubeShorts = data.exportToYoutubeShorts;
    if (data.exportToAppleMaps !== undefined) updateData.exportToAppleMaps = data.exportToAppleMaps;
    if (data.exportToBingPlaces !== undefined) updateData.exportToBingPlaces = data.exportToBingPlaces;
    if (data.exportToGoogleMapsPost !== undefined) updateData.exportToGoogleMapsPost = data.exportToGoogleMapsPost;
    if (data.exportToLinkedInNewsletter !== undefined) updateData.exportToLinkedInNewsletter = data.exportToLinkedInNewsletter;
    if (data.exportToMedium !== undefined) updateData.exportToMedium = data.exportToMedium;
    if (data.exportToNextdoor !== undefined) updateData.exportToNextdoor = data.exportToNextdoor;
    if (data.exportToOlxKenya !== undefined) updateData.exportToOlxKenya = data.exportToOlxKenya;
    if (data.exportToPigiaMe !== undefined) updateData.exportToPigiaMe = data.exportToPigiaMe;
    if (data.exportToReddit !== undefined) updateData.exportToReddit = data.exportToReddit;
    if (data.exportToSnapchat !== undefined) updateData.exportToSnapchat = data.exportToSnapchat;
    if (data.exportToYoutube !== undefined) updateData.exportToYoutube = data.exportToYoutube;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // --- Trigger Back-In-Stock if applicable ---
    if (data.stock !== undefined) {
      void detectBackInStock(id, currentProduct.stock, data.stock);
    }

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
