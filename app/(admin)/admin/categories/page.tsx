import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCategoriesClient } from "@/components/admin/admin-categories-client";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdminSection("/admin/categories");
  const { edit: editId } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true, slug: true } },
    },
  });

  const parentOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
  }));

  return (
    <div className="p-6">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-foreground">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground">Categories</span>
      </nav>

      <Suspense fallback={<div className="animate-pulse py-8">Loading…</div>}>
        <AdminCategoriesClient
          initialCategories={categories}
          parentOptions={parentOptions}
          initialEditId={editId ?? null}
        />
      </Suspense>
    </div>
  );
}
