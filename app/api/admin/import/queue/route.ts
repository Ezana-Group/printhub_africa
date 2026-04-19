import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "review";

  const statusMap: Record<string, any[]> = {
    drafts: ["PENDING", "PROCESSING", "DRAFT"],
    review: ["PENDING_REVIEW"],
    rejected: ["REJECTED"],
    approved: ["APPROVED"],
  };

  const selectedStatuses = statusMap[tab] || ["PENDING_REVIEW"];

  try {
    const records = await prisma.catalogueImportQueue.findMany({
      where: {
        status: { in: selectedStatuses }
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        submittedBy: { select: { name: true, email: true } }
      }
    });

    const items = records.map(r => ({
      id: r.id,
      name: r.scrapedName || "Untitled draft",
      platform: (r as any).isManual ? "MANUAL" : (r.sourceUrl?.includes("printables") ? "PRINTABLES" : "EXTERNAL"),
      licenceType: r.licenseType || "Unknown",
      importedAt: r.createdAt,
      updatedAt: r.updatedAt,
      status: r.status,
      thumbnailUrl: r.scrapedImageUrls?.[0] || null,
      isManual: (r as any).isManual,
      scrapedImageUrls: r.scrapedImageUrls,
      reviewNotes: r.reviewNotes,
      submittedBy: r.submittedBy?.name || r.submittedBy?.email || null,
      submittedAt: r.submittedAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[QUEUE_FETCH_ERROR]", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
