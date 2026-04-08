import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  try {
    const records = await prisma.catalogueImportQueue.findMany({
      where: {
        status: {
          in: ["PENDING_REVIEW", "FAILED", "PROCESSING"]
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const items = records.map(r => ({
      id: r.id,
      name: r.scrapedName || "Untitled manual draft",
      platform: r.isManual ? "MANUAL" : (r.sourceUrl?.includes("printables") ? "PRINTABLES" : "EXTERNAL"),
      licenceType: r.licenseType || "Unknown",
      importedAt: r.createdAt,
      status: r.status,
      thumbnailUrl: r.scrapedImageUrls?.[0] || null,
      isManual: r.isManual,
      scrapedImageUrls: r.scrapedImageUrls
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
