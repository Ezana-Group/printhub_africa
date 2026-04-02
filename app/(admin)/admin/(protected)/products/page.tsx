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
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    categoryId: p.categoryId,
    category: p.category,
    productType: p.productType,
    isPOD: p.isPOD,
    basePrice: Number(p.basePrice),
    comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
    stock: p.stock,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    images: p.images ?? [],
    createdAt: p.createdAt,
    _variantsCount: p._count.variants,
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
