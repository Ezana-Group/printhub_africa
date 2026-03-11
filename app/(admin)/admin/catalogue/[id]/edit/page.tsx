import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { CatalogueEditForm } from "./CatalogueEditForm";

export default async function CatalogueEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminSection("/admin/catalogue");
  const { id } = await params;
  const { tab } = await searchParams;

  const item = await prisma.catalogueItem.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      availableMaterials: true,
      category: true,
      designer: true,
    },
  });

  if (!item) notFound();

  const categories = await prisma.catalogueCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/catalogue"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Catalogue
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{item.name}</span>
      </div>
      <CatalogueEditForm
        item={JSON.parse(JSON.stringify(item))}
        categories={categories}
        defaultTab={tab ?? "details"}
      />
    </div>
  );
}
