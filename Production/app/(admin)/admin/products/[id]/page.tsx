import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/products");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        categoryId: true,
        productType: true,
        basePrice: true,
        comparePrice: true,
        sku: true,
        stock: true,
        minOrderQty: true,
        maxOrderQty: true,
        images: true,
        materials: true,
        colors: true,
        isActive: true,
        isFeatured: true,
        metaTitle: true,
        metaDescription: true,
        category: true,
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Edit {product.name}</h1>
      <p className="text-muted-foreground mt-1">Update product details.</p>
      <div className="mt-6">
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.shortDescription,
            categoryId: product.categoryId,
            productType: product.productType,
            basePrice: Number(product.basePrice),
            comparePrice: product.comparePrice != null ? Number(product.comparePrice) : null,
            sku: product.sku,
            stock: product.stock,
            minOrderQty: product.minOrderQty,
            maxOrderQty: product.maxOrderQty,
            images: product.images,
            materials: product.materials,
            colors: product.colors,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
          }}
        />
      </div>
    </div>
  );
}
