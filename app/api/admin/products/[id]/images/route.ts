import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

// GET /api/admin/products/[id]/images
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const rows = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    });
    const images = rows.map((img) => ({
      id: img.id,
      url: img.url,
      storageKey: img.storageKey ?? undefined,
      uploadId: img.uploadId ?? undefined,
      altText: img.altText ?? undefined,
      isMain: img.isPrimary,
      sortOrder: img.sortOrder,
      source: img.storageKey ? ("uploaded" as const) : ("url" as const),
    }));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}

// PUT /api/admin/products/[id]/images — replace all images
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;
  let body: { images?: Array<{ id?: string; url: string; storageKey?: string; uploadId?: string; altText?: string; isMain?: boolean; sortOrder?: number }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const images = Array.isArray(body.images) ? body.images : [];
  try {
    await prisma.productImage.deleteMany({
      where: { productId: id },
    });
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((img, i) => ({
          productId: id,
          url: img.url,
          storageKey: img.storageKey ?? null,
          uploadId: img.uploadId ?? null,
          altText: img.altText ?? null,
          isPrimary: img.isMain ?? i === 0,
          sortOrder: img.sortOrder ?? i,
        })),
      });
    }
    // Keep product.images in sync for backward compatibility (first image as legacy)
    const urls = images.map((img) => img.url);
    await prisma.product.update({
      where: { id },
      data: { images: urls },
    });
    return NextResponse.json({ success: true, count: images.length });
  } catch (err) {
    console.error("Product images update error:", err);
    return NextResponse.json({ error: "Failed to save images" }, { status: 500 });
  }
}
