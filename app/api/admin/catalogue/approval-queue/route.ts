import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus, CatalogueSourceType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "catalogue_view" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "PENDING_REVIEW";
  const search = searchParams.get("search")?.trim() || "";
  const platform = searchParams.get("platform") || "All";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importWhere: any = {};

  // Tab Status Filter Mapping
  if (tab === "PENDING_REVIEW" || tab === "pending") {
    where.status = CatalogueStatus.PENDING_REVIEW;
    importWhere.status = "PENDING_REVIEW";
  } else if (tab === "LIVE" || tab === "approved") {
    where.status = { in: [CatalogueStatus.LIVE, CatalogueStatus.PAUSED] };
    // Approved imports usually become CatalogueItems, so we might not need to fetch from ImportQueue here
    importWhere.status = "APPROVED"; 
  } else if (tab === "ARCHIVED" || tab === "archived") {
    where.status = { in: [CatalogueStatus.ARCHIVED, CatalogueStatus.RETIRED] };
    importWhere.status = "NOT_APPLICABLE"; // Import items aren't usually archived
  } else if (tab === "DRAFT" || tab === "draft") {
    where.status = CatalogueStatus.DRAFT;
    importWhere.status = "DRAFT";
  } else if (tab === "REJECTED" || tab === "rejected") {
    where.status = CatalogueStatus.REJECTED;
    importWhere.status = "REJECTED";
  }

  // Search & Platform Filters
  if (search) {
    const searchConditions = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } }
    ];
    where.OR = searchConditions;
    
    importWhere.OR = [
      { scrapedName: { contains: search, mode: "insensitive" } },
      { scrapedDescription: { contains: search, mode: "insensitive" } }
    ];
  }

  if (platform !== "All") {
    where.sourceType = platform.toUpperCase() as CatalogueSourceType;
    // For import queue, we don't have sourceType enum, but we can check sourceUrl or platform field if it exists
    // importWhere.platform = platform; 
  }

  try {
    const [catalogueItems, importItems] = await Promise.all([
      prisma.catalogueItem.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          photos: { orderBy: { sortOrder: "asc" }, take: 1 },
          importedBy: { select: { name: true, email: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      importWhere.status === "NOT_APPLICABLE" ? [] : prisma.catalogueImportQueue.findMany({
        where: importWhere,
        orderBy: { updatedAt: "desc" },
        include: {
          submittedBy: { select: { name: true, email: true } }
        }
      }),
    ]);

    // Normalize ImportItems to match CatalogueItem structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedImports = importItems.map((item: any) => ({
      id: item.id,
      name: item.scrapedName || "Unnamed Import",
      slug: `import-${item.id}`,
      status: item.status,
      sourceType: item.isManual ? "MANUAL" : "IMPORT",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      importedAt: item.createdAt,
      category: item.scrapedCategory ? { name: item.scrapedCategory, slug: "" } : null,
      importedBy: item.submittedBy,
      photos: item.scrapedImageUrls ? item.scrapedImageUrls.slice(0, 1).map((url: string) => ({ url, isPrimary: true })) : [],
      isImport: true, // Flag for UI
    }));

    const combinedItems = [...catalogueItems, ...normalizedImports].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Apply pagination to combined list
    const paginatedItems = combinedItems.slice((page - 1) * limit, page * limit);
    const total = combinedItems.length;

    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_LIST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
