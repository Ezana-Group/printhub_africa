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
  if (tab === "pending" || tab === "PENDING_REVIEW") {
    where.status = CatalogueStatus.PENDING_REVIEW;
  } else if (tab === "approved" || tab === "LIVE") {
    where.status = { in: [CatalogueStatus.LIVE, CatalogueStatus.PAUSED] };
  } else if (tab === "archived" || tab === "ARCHIVED") {
    where.status = { in: [CatalogueStatus.ARCHIVED, CatalogueStatus.RETIRED] };
  }

  // Search & Platform Filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchConditions: any[] = [];
  
  if (search) {
    searchConditions.push({ name: { contains: search, mode: "insensitive" } });
    
    // Check if the search term matches any for platform
    const platformMatch = (Object.values(CatalogueSourceType) as string[]).find(
      (v) => v.toUpperCase() === search.toUpperCase()
    );
    if (platformMatch) {
      searchConditions.push({ sourceType: platformMatch as CatalogueSourceType });
    }
  }

  if (searchConditions.length > 0) {
    where.OR = searchConditions;
  }

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
          rejectedBy: { select: { name: true, email: true } },
          category: { select: { name: true, slug: true } },
          availableMaterials: true,
        },
      }),
      prisma.catalogueItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_LIST]", error);
    // If it's a relation error (e.g. archivedBy missing column), fallback to a simpler query
    try {
      const [items, total] = await Promise.all([
        prisma.catalogueItem.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            photos: { orderBy: { sortOrder: "asc" }, take: 1 },
            category: { select: { name: true, slug: true } },
          },
        }),
        prisma.catalogueItem.count({ where }),
      ]);
      return NextResponse.json({
        items,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
      });
    } catch {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
}
