import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { CatalogueItemForm } from "../../../../../components/admin/catalogue-item-form";
import { Button } from "@/components/ui/button";

export default async function NewCatalogueItemPage() {
  await requireAdminSection("/admin/catalogue/new");
  let categories: { id: string; name: string; slug: string }[] = [];
  try {
    const list = await prisma.catalogueCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    });
    categories = list;
  } catch {
    // DB unavailable
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Add catalogue item</h1>
        <p className="text-slate-600 mt-0.5">Create a new print-on-demand item manually.</p>
      </div>
      {categories.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 max-w-xl">
          <p>No catalogue categories found. Create categories first under Catalogue → Categories, or run the database seed.</p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/admin/catalogue">Back to catalogue</Link>
          </Button>
        </div>
      ) : (
        <CatalogueItemForm categories={categories} />
      )}
    </div>
  );
}
