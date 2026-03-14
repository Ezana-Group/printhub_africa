import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safePublicFileUrl } from "@/lib/r2";
import type { ProductType } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Prisma 7 expects orderBy as an array for multiple fields */
const SORT_MAP: Record<string, { [k: string]: "asc" | "desc" }[]> = {
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ basePrice: "asc" }],
  "price-desc": [{ basePrice: "desc" }],
  bestselling: [{ id: "asc" }], // TODO: order by order count
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const category = searchParams.get("category") ?? undefined;
    const productType = searchParams.get("type") ?? undefined;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const q = searchParams.get("q")?.trim() || undefined;
    const sort = searchParams.get("sort") || "featured";
    const inStock = searchParams.get("inStock");

    const orderBy = SORT_MAP[sort] ?? SORT_MAP.featured;

    const where: {
      isActive: boolean;
      categoryId?: string;
      productType?: ProductType;
      basePrice?: { gte?: number; lte?: number };
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; slug?: { contains: string; mode: "insensitive" } }>;
      stock?: number | { gt: number };
    } = { isActive: true };

    if (category) {
      const cat = await prisma.category.findFirst({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (productType) {
      const typeMap: Record<string, "READYMADE_3D" | "LARGE_FORMAT" | "CUSTOM"> = {
        "3d": "READYMADE_3D",
        largeformat: "LARGE_FORMAT",
        custom: "CUSTOM",
      };
      const t = typeMap[productType.toLowerCase()];
      if (t) where.productType = t;
    }
    if (minPrice != null && !Number.isNaN(minPrice) || maxPrice != null && !Number.isNaN(maxPrice)) {
      where.basePrice = {};
      if (minPrice != null && !Number.isNaN(minPrice)) (where.basePrice as Record<string, number>).gte = minPrice;
      if (maxPrice != null && !Number.isNaN(maxPrice)) (where.basePrice as Record<string, number>).lte = maxPrice;
    }
    if (inStock === "true") where.stock = { gt: 0 };
    if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          productImages: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productIds = products.map((p) => p.id);
    const reviewStats =
      productIds.length > 0
        ? await prisma.productReview.groupBy({
            by: ["productId"],
            where: { productId: { in: productIds }, isApproved: true },
            _count: { id: true },
            _avg: { rating: true },
          })
        : [];
    const statsByProductId: Record<string, { avg: number; count: number }> = {};
    for (const s of reviewStats) {
      statsByProductId[s.productId] = {
        avg: s._avg.rating != null ? Math.round(s._avg.rating * 10) / 10 : 0,
        count: s._count.id,
      };
    }

    const items = products.map((p) => {
      const imgs = p.productImages ?? [];
      const featured = imgs.find((i) => i.isPrimary) ?? imgs[0];
      const rawImage = p.images?.[0] ?? featured?.url ?? null;
      const image =
        rawImage && rawImage.startsWith("http")
          ? rawImage
          : featured?.storageKey
            ? safePublicFileUrl(featured.storageKey)
            : null;
      const stats = statsByProductId[p.id];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        category: p.category,
        productType: p.productType,
        image,
        imagesCount: imgs.length,
        basePrice: Number(p.basePrice),
        comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
        sku: p.sku,
        stock: p.stock,
        isFeatured: p.isFeatured,
        averageRating: stats?.avg ?? null,
        reviewCount: stats?.count ?? 0,
      };
    });

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("Products API error:", e);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
