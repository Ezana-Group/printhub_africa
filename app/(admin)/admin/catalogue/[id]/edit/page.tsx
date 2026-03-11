import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { CatalogueItemFormFull } from "@/components/admin/catalogue-item-form-full";
import { Button } from "@/components/ui/button";

export default async function EditCatalogueItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/catalogue");
  const { id } = await params;

  const [item, categories] = await Promise.all([
    prisma.catalogueItem.findUnique({
      where: { id },
      include: {
        category: true,
        designer: true,
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        availableMaterials: true,
      },
    }),
    prisma.catalogueCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!item) notFound();

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Edit — {item.name}
          </h1>
          <p className="text-slate-600 mt-0.5">
            /catalogue/{item.slug}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/catalogue">← Back to catalogue</Link>
        </Button>
      </div>
      <CatalogueItemFormFull
        item={JSON.parse(JSON.stringify(item))}
        categories={categories}
      />
    </div>
  );
}
