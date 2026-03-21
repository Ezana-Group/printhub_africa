import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";

export async function GET() {
  const auth = await requireAdminApi({ permission: "catalogue_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const [pending, approved, archived] = await Promise.all([
      prisma.catalogueItem.count({
        where: { status: CatalogueStatus.PENDING_REVIEW },
      }),
      prisma.catalogueItem.count({
        where: {
          status: {
            in: [CatalogueStatus.LIVE, CatalogueStatus.PAUSED, CatalogueStatus.RETIRED],
          },
        },
      }),
      prisma.catalogueItem.count({
        where: { status: CatalogueStatus.RETIRED },
      }),
    ]);

    return NextResponse.json({
      counts: {
        PENDING_REVIEW: pending,
        LIVE: approved,
        ARCHIVED: archived,
      }
    });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_COUNT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
