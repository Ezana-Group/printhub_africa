export const dynamic = 'force-dynamic'
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
  try {

  await requireAdminSection("/admin/categories");
  const { edit: editId } = await searchParams;
  const allCategories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true, slug: true } },
    },
  });

  // Build tree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildTree = (nodes: any[], parentId: string | null = null): any[] => {
    return nodes
      .filter((n) => n.parentId === parentId)
      .map((n) => ({
        ...n,
        children: buildTree(nodes, n.id),
      }));
  };

  const categories = buildTree(allCategories);

  const parentOptions = allCategories.map((c) => ({
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

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
