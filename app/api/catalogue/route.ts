import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CatalogueStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;
const SORT_OPTIONS = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
  "popular",
] as const;

function effectivePrice(item: {
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  availableMaterials: { priceModifierKes: number | null; isDefault: boolean }[];
}): number | null {
  const base = item.priceOverrideKes ?? item.basePriceKes;
  if (base == null) return null;
  const defaultMat = item.availableMaterials.find((m) => m.isDefault);
  const modifier = defaultMat?.priceModifierKes ?? 0;
  return base + modifier;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const category = searchParams.get("category") ?? undefined;
    const material = searchParams.get("material") ?? undefined;
    const colour = searchParams.get("colour") ?? undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const rawSort = searchParams.get("sort") || "featured";
    const sort = SORT_OPTIONS.includes(rawSort as (typeof SORT_OPTIONS)[number])
      ? (rawSort as (typeof SORT_OPTIONS)[number])
      : "featured";
    const featuredOnly = searchParams.get("featured") === "true";
    const tag = searchParams.get("tag") ?? undefined;
    const priceRange = searchParams.get("price") ?? undefined; // under-500 | 500-1500 | 1500-3000 | over-3000

    const where: {
      status: typeof CatalogueStatus.LIVE;
      categoryId?: string;
      isFeatured?: boolean;
      tags?: { has: string };
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; shortDescription?: { contains: string; mode: "insensitive" } }>;
      availableMaterials?: { some: { materialCode?: string; isAvailable: boolean } };
      basePriceKes?: { gte?: number; lte?: number };
    } = { status: CatalogueStatus.LIVE };

    if (category) {
      const cat = await prisma.category.findFirst({
        where: { slug: category, isActive: true },
      });
      if (cat) where.categoryId = cat.id;
    }
    if (featuredOnly) where.isFeatured = true;
    if (tag) where.tags = { has: tag };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
      ];
    }
    if (material) {
      where.availableMaterials = { some: { materialCode: material, isAvailable: true } };
    }
    if (colour) {
      where.availableMaterials = { some: { isAvailable: true } };
    }
    if (priceRange) {
      switch (priceRange) {
        case "under-500":
          where.basePriceKes = { lte: 500 };
          break;
        case "500-1500":
          where.basePriceKes = { gte: 500, lte: 1500 };
          break;
        case "1500-3000":
          where.basePriceKes = { gte: 1500, lte: 3000 };
          break;
        case "over-3000":
          where.basePriceKes = { gte: 3000 };
          break;
      }
    }

    const orderBy =
      sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : sort === "price-asc"
          ? [{ basePriceKes: "asc" as const }]
          : sort === "price-desc"
            ? [{ basePriceKes: "desc" as const }]
            : sort === "popular"
              ? [{ isPopular: "desc" as const }, { sortOrder: "asc" as const }]
              : [{ isFeatured: "desc" as const }, { sortOrder: "asc" as const }, { createdAt: "desc" as const }];

    const [items, total] = await Promise.all([
      prisma.catalogueItem.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          photos: { orderBy: { sortOrder: "asc" }, take: 5 },
          availableMaterials: { where: { isAvailable: true }, select: { materialCode: true, materialName: true, priceModifierKes: true, isDefault: true } },
        },
      }),
      prisma.catalogueItem.count({ where }),
    ]);

    const withFromPrice = items.map((item) => {
      const fromPrice = effectivePrice(item);
      const primaryPhoto = item.photos.find((p) => p.isPrimary) ?? item.photos[0];
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        category: item.category,
        tags: item.tags,
        licenseType: item.licenseType,
        photos: item.photos,
        primaryPhotoUrl: primaryPhoto?.url ?? null,
        availableMaterials: item.availableMaterials,
        fromPriceKes: fromPrice,
        isFeatured: item.isFeatured,
        isNewArrival: item.isNewArrival,
        isStaffPick: item.isStaffPick,
        isPopular: item.isPopular,
      };
    });

    return NextResponse.json({
      items: withFromPrice,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (e) {
    console.error("Catalogue list error:", e);
    return NextResponse.json(
      { error: "Failed to fetch catalogue" },
      { status: 500 }
    );
  }
}
