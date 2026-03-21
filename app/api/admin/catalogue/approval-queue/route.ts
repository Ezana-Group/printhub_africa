import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus, CatalogueSourceType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "catalogue_view" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "pending";
  const search = searchParams.get("search")?.trim() || "";
  const platform = searchParams.get("platform") || "All";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Tab Status Filter
  if (tab === "pending") {
    where.status = CatalogueStatus.PENDING_REVIEW;
  } else if (tab === "approved") {
    where.status = { in: [CatalogueStatus.LIVE, CatalogueStatus.PAUSED, CatalogueStatus.RETIRED] };
  } else if (tab === "archived") {
    where.status = CatalogueStatus.ARCHIVED;
  }

  // Search Filter (Name or Platform)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { sourceType: { equals: search.toUpperCase() as any } }, // Best effort for platform search
    ];
  }

  // Platform Filter
  if (platform !== "All") {
    where.sourceType = platform.toUpperCase() as CatalogueSourceType;
  }

  try {
    const [items, total] = await Promise.all([
      prisma.catalogueItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          photos: { orderBy: { sortOrder: "asc" }, take: 1 },
          importedBy: { select: { name: true, email: true } },
          approvedBy: { select: { name: true, email: true } },
          archivedBy: { select: { name: true, email: true } },
          category: { select: { name: true, slug: true } },
          availableMaterials: true,
        },
      }),
      prisma.catalogueItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
