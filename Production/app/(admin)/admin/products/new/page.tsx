import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export default async function NewProductPage() {
  await requireAdminSection("/admin/products");
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  try {
    categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch {
    // DB unavailable
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Add product</h1>
      <p className="text-muted-foreground mt-1">Create a new product in the catalog.</p>
      <div className="mt-6">
        {categories.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p>No categories found. Create categories first or run the database seed.</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/admin/products">Back to products</Link>
            </Button>
          </div>
        ) : (
          <ProductForm
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
          />
        )}
      </div>
    </div>
  );
}
