import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;

  const [pending, importQueue] = await Promise.all([
    prisma.catalogueItem.findMany({
      where: { status: CatalogueStatus.PENDING_REVIEW },
      orderBy: { updatedAt: "asc" },
      include: {
        category: { select: { name: true, slug: true } },
        photos: { orderBy: { sortOrder: "asc" } },
        availableMaterials: true,
      },
    }),
    prisma.catalogueImportQueue.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    pendingReview: pending,
    importQueue,
    count: pending.length,
  });
}
