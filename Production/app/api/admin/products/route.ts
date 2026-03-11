import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(50000).optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().min(1),
  productType: z.enum(["READYMADE_3D", "LARGE_FORMAT", "CUSTOM"]),
  basePrice: z.number().min(0),
  comparePrice: z.number().min(0).optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0),
  minOrderQty: z.number().int().min(1).optional(),
  maxOrderQty: z.number().int().min(1).optional(),
  images: z.array(z.string().url()).optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  let finalSlug = slug;
  if (existing) {
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug: `${slug}-${n}` } })) n++;
    finalSlug = `${slug}-${n}`;
  }
  // Normalize SKU: empty string -> null so we don't hit unique constraint on duplicate empty SKUs
  const sku = (data.sku?.trim() || null) as string | null;
  if (sku) {
    const existingBySku = await prisma.product.findUnique({ where: { sku } });
    if (existingBySku) {
      return NextResponse.json(
        { error: "SKU already in use. Please choose a different SKU or leave it blank." },
        { status: 400 }
      );
    }
  }
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description ?? null,
        shortDescription: data.shortDescription ?? null,
        categoryId: data.categoryId,
        productType: data.productType,
        images: data.images ?? [],
        basePrice: data.basePrice,
        comparePrice: data.comparePrice ?? null,
        sku,
        stock: data.stock,
        minOrderQty: data.minOrderQty ?? 1,
        maxOrderQty: data.maxOrderQty ?? null,
        materials: data.materials ?? [],
        colors: data.colors ?? [],
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
      },
    });
    return NextResponse.json({ product });
  } catch (e: unknown) {
    console.error("Admin create product error:", e);
    const prismaError = e as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "SKU or slug already in use. Please change the SKU or product name." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
