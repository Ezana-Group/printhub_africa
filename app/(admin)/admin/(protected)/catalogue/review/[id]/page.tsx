import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/admin-permissions";
import { AdminCatalogueReviewClient } from "./admin-catalogue-review-client";

export default async function AdminCatalogueReviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];

  if (!canAccessRoute("/admin/catalogue/review", role, permissions)) {
    redirect("/admin/access-denied");
  }

  const { id } = await params;

  const importItem = await prisma.catalogueImportQueue.findUnique({
    where: { id }
  });

  if (!importItem) {
    notFound();
  }

  // Fetch categories for the dropdown
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return (
    <AdminCatalogueReviewClient 
      importItem={JSON.parse(JSON.stringify(importItem))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
