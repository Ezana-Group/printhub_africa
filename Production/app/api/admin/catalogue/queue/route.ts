import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;

  const [pending, importQueue, draftCount] = await Promise.all([
    prisma.catalogueItem.findMany({
      where: { status: CatalogueStatus.PENDING_REVIEW },
      orderBy: { createdAt: "asc" },
      include: {
        category: { select: { name: true, slug: true } },
        photos: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        availableMaterials: true,
        designer: { select: { name: true } },
      },
    }),
    prisma.catalogueImportQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.catalogueItem.count({ where: { status: CatalogueStatus.DRAFT } }),
  ]);

  return NextResponse.json({
    pendingReview: pending,
    importQueue,
    draftCount,
  });
}
