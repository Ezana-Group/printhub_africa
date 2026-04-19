import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi({ permission: "catalogue_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const [
      pendingCat, pendingImp,
      liveCat,
      archivedCat,
      draftCat, draftImp,
      rejectedCat, rejectedImp
    ] = await Promise.all([
      prisma.catalogueItem.count({ where: { status: CatalogueStatus.PENDING_REVIEW } }),
      prisma.catalogueImportQueue.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.catalogueItem.count({ where: { status: { in: [CatalogueStatus.LIVE, CatalogueStatus.PAUSED] } } }),
      prisma.catalogueItem.count({ where: { status: { in: [CatalogueStatus.ARCHIVED, CatalogueStatus.RETIRED] } } }),
      prisma.catalogueItem.count({ where: { status: CatalogueStatus.DRAFT } }),
      prisma.catalogueImportQueue.count({ where: { status: "DRAFT" } }),
      prisma.catalogueItem.count({ where: { status: CatalogueStatus.REJECTED } }),
      prisma.catalogueImportQueue.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      counts: {
        PENDING_REVIEW: pendingCat + pendingImp,
        LIVE: liveCat,
        ARCHIVED: archivedCat,
        DRAFT: draftCat + draftImp,
        REJECTED: rejectedCat + rejectedImp,
      }
    });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_COUNT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
