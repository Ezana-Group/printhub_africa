export const dynamic = 'force-dynamic'
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductsAdminClient } from "@/components/admin/products-admin-client";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminProductsPage() {
  await requireAdminSection("/admin/products");
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { variants: true } },
      },
    }).catch((err) => {
      console.error("[AdminProductsPage] Product fetch error:", err);
      return [];
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }).catch((err) => {
      console.error("[AdminProductsPage] Category fetch error:", err);
      return [];
    }),
  ]);

  const rows = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || "",
    description: p.description || "",
    categoryId: p.categoryId,
    category: p.category,
    productType: p.productType,
    isPOD: p.isPOD,
    basePrice: Number(p.basePrice || 0),
    comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
    stock: p.stock ?? 0,
    isActive: p.isActive ?? false,
    isFeatured: p.isFeatured ?? false,
    images: p.images ?? [],
    createdAt: p.createdAt,
    _variantsCount: p._count?.variants || 0,
  }));

  return (
    <Suspense fallback={<div className="p-6 animate-pulse">Loading products…</div>}>
      <ProductsAdminClient
        products={rows}
        categories={categories}
      />
    </Suspense>
  );
}
