import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";
import { CatalogueStatus, CatalogueSourceType, CatalogueLicense } from "@prisma/client";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where: {
    status?: CatalogueStatus;
    categoryId?: string;
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; slug?: { contains: string; mode: "insensitive" } }>;
  } = {};
  if (status && ["DRAFT", "PENDING_REVIEW", "LIVE", "PAUSED", "RETIRED"].includes(status)) {
    where.status = status as CatalogueStatus;
  }
  if (category) {
    const cat = await prisma.catalogueCategory.findFirst({ where: { slug: category } });
    if (cat) where.categoryId = cat.id;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.catalogueItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        availableMaterials: { where: { isAvailable: true }, select: { materialCode: true, materialName: true, priceModifierKes: true, isDefault: true } },
      },
    }),
    prisma.catalogueItem.count({ where }),
  ]);

  const pendingCount = await prisma.catalogueItem.count({ where: { status: CatalogueStatus.PENDING_REVIEW } });

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    pendingReviewCount: pendingCount,
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z.string().max(300).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  designerId: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  licenseType: z.enum(["CC0", "CC_BY", "CC_BY_SA", "PARTNERSHIP", "ORIGINAL"]).optional(),
  designerCredit: z.string().max(500).optional().nullable(),
  sourceType: z.enum(["MANUAL", "PRINTABLES", "THINGIVERSE", "PARTNER", "ORIGINAL"]).optional(),
  minQuantity: z.number().int().min(1).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isStaffPick: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  photos: z.array(z.string()).optional(),
  modelUrl: z.string().optional(),
  materials: z.array(z.string()).optional(),
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
  const slug = (data.slug?.trim() || slugify(data.name)) as string;
  const existing = await prisma.catalogueItem.findUnique({ where: { slug } });
  let finalSlug = slug;
  if (existing) {
    let n = 1;
    while (await prisma.catalogueItem.findUnique({ where: { slug: `${slug}-${n}` } })) n++;
    finalSlug = `${slug}-${n}`;
  }

  try {
    const item = await prisma.catalogueItem.create({
      data: {
        name: data.name,
        slug: finalSlug,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? "",
        categoryId: data.categoryId,
        tags: data.tags ?? [],
        designerId: data.designerId ?? null,
        sourceUrl: data.sourceUrl ?? null,
        licenseType: (data.licenseType as CatalogueLicense) ?? "CC_BY",
        designerCredit: data.designerCredit ?? null,
        sourceType: (data.sourceType as CatalogueSourceType) ?? "MANUAL",
        status: CatalogueStatus.DRAFT,
        minQuantity: data.minQuantity ?? 1,
        maxQuantity: data.maxQuantity ?? 50,
        isFeatured: data.isFeatured ?? false,
        isNewArrival: data.isNewArrival ?? false,
        isStaffPick: data.isStaffPick ?? false,
        sortOrder: data.sortOrder ?? 0,
        modelUrl: data.modelUrl ?? null,
        photos: data.photos && data.photos.length > 0 ? {
          create: data.photos.map((url, i) => ({
            url,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        } : undefined,
        availableMaterials: data.materials && data.materials.length > 0 ? {
          create: data.materials.map((m) => {
            const code = m.toUpperCase().replace(/\s+/g, "_");
            return {
              materialCode: code,
              materialName: m,
              isAvailable: true,
            };
          }),
        } : undefined,
      },
      include: {
        photos: true,
        availableMaterials: true,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("Create catalogue item error:", e);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
