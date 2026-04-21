import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { generateNextProductSku } from "@/lib/product-utils";

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
  productType: z.enum(["READYMADE_3D", "LARGE_FORMAT", "CUSTOM", "PRINT_ON_DEMAND", "POD", "SERVICE"]),
  isPOD: z.boolean().optional(),
  printTimeEstimate: z.string().nullable().optional(),
  filamentWeightGrams: z.number().nullable().optional(),
  basePrice: z.number().min(0),
  comparePrice: z.number().min(0).optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0).nullable().optional(),
  minOrderQty: z.number().int().min(1).optional(),
  maxOrderQty: z.number().int().min(1).optional(),
  images: z.array(z.string().url()).optional(),
  productionFiles: z.array(z.string().url()).optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
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
  featuredThisWeek: z.boolean().optional(),
});

function normalizeProductType(type: z.infer<typeof createSchema>["productType"]) {
  return type === "POD" ? "PRINT_ON_DEMAND" : type;
}

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const normalizedProductType = normalizeProductType(data.productType);
  const slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.product.findUnique({ where: { slug } });
  let finalSlug = slug;
  if (existing) {
    let n = 1;
    while (await prisma.product.findUnique({ where: { slug: `${slug}-${n}` } })) n++;
    finalSlug = `${slug}-${n}`;
  }
  // Normalize SKU: empty string -> auto-generate; otherwise use provided (must be unique)
  let sku: string | null = (data.sku?.trim() || null) as string | null;
  if (!sku) {
    sku = await generateNextProductSku(data.categoryId);
  } else {
    const existingBySku = await prisma.product.findUnique({ where: { sku } });
    if (existingBySku) {
      return NextResponse.json(
        { error: "SKU already in use. Please choose a different SKU or leave it blank to auto-generate." },
        { status: 400 }
      );
    }
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      name: data.name,
      slug: finalSlug,
      description: data.description ?? null,
      shortDescription: data.shortDescription ?? null,
      categoryId: data.categoryId,
      productType: normalizedProductType,
      images: data.images ?? [],
      productionFiles: data.productionFiles ?? [],
      basePrice: data.basePrice,
      comparePrice: data.comparePrice ?? null,
      sku,
      stock: data.stock !== undefined ? data.stock : 0,
      isPOD: data.isPOD ?? normalizedProductType === "PRINT_ON_DEMAND",
      printTimeEstimate: data.printTimeEstimate ?? null,
      filamentWeightGrams: data.filamentWeightGrams ?? null,
      minOrderQty: data.minOrderQty ?? 1,
      maxOrderQty: data.maxOrderQty ?? null,
      materials: data.materials ?? [],
      colors: data.colors ?? [],
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      exportToGoogle: data.exportToGoogle ?? true,
      exportToGoogleBiz: data.exportToGoogleBiz ?? true,
      exportToLinkedIn: data.exportToLinkedIn ?? false,
      exportToMeta: data.exportToMeta ?? true,
      exportToPinterest: data.exportToPinterest ?? false,
      exportToTiktok: data.exportToTiktok ?? true,
      exportToX: data.exportToX ?? false,
      exportToGoogleDiscover: data.exportToGoogleDiscover ?? false,
      exportToInstagramReels: data.exportToInstagramReels ?? false,
      exportToInstagramStories: data.exportToInstagramStories ?? false,
      exportToJiji: data.exportToJiji ?? false,
      exportToTelegram: data.exportToTelegram ?? false,
      exportToWhatsappChannel: data.exportToWhatsappChannel ?? false,
      exportToWhatsappStatus: data.exportToWhatsappStatus ?? false,
      exportToYoutubeShorts: data.exportToYoutubeShorts ?? false,
      exportToAppleMaps: data.exportToAppleMaps ?? false,
      exportToBingPlaces: data.exportToBingPlaces ?? false,
      exportToGoogleMapsPost: data.exportToGoogleMapsPost ?? true,
      exportToLinkedInNewsletter: data.exportToLinkedInNewsletter ?? false,
      exportToMedium: data.exportToMedium ?? false,
      exportToNextdoor: data.exportToNextdoor ?? false,
      exportToOlxKenya: data.exportToOlxKenya ?? false,
      exportToPigiaMe: data.exportToPigiaMe ?? false,
      exportToReddit: data.exportToReddit ?? false,
      exportToSnapchat: data.exportToSnapchat ?? false,
      exportToYoutube: data.exportToYoutube ?? false,
      featuredThisWeek: data.featuredThisWeek ?? false,
    };

    const product = await prisma.product.create({
      data: createData,
    });
    revalidateTag("products");
    revalidateTag("homepage");
    revalidatePath("/shop");
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
