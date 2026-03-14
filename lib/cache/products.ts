import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * React cache() deduplicates identical calls within a single render pass.
 * If two server components on the same page both call getFeaturedProducts(),
 * the database is only queried ONCE.
 */
export const getFeaturedProducts = cache(async () => {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      productImages: { orderBy: { sortOrder: "asc" } },
      category: { select: { name: true, slug: true } },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
});

export const getAllCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
});

type ShopProductsParams = {
  category?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export const getShopProducts = cache(async (params: ShopProductsParams = {}) => {
  const { category, page = 1, limit = 20, sort = "newest" } = params;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { basePrice: "asc" as const }
      : sort === "price_desc"
        ? { basePrice: "desc" as const }
        : { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        productImages: { orderBy: { sortOrder: "asc" }, take: 5 },
        category: { select: { name: true, slug: true } },
      },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / limit) };
});
