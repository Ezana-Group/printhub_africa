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
      orderBy: { createdAt: "asc" },
      include: {
        category: { select: { name: true, slug: true } },
        photos: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.catalogueImportQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    pendingReview: pending,
    importQueue,
  });
}
