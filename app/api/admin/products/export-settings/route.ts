import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api"; 
import { writeAudit } from "@/lib/audit";

// bulk update export settings
export async function POST(req: NextRequest) {
  const result = await requireRole(req, "ADMIN");
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  try {
    const { ids, field, value } = await req.json();

    if (!ids || !Array.isArray(ids) || !field || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // List of allowed fields to prevent arbitrary updates
    const allowedFields = [
      "exportToGoogle",
      "exportToMeta",
      "exportToTiktok",
      "exportToLinkedIn",
      "exportToPinterest",
      "exportToX",
      "exportToGoogleBiz",
      "exportToGoogleDiscover",
      "exportToInstagramReels",
      "exportToInstagramStories",
      "exportToJiji",
      "exportToTelegram",
      "exportToWhatsappChannel",
      "exportToWhatsappStatus",
      "exportToYoutubeShorts",
      "exportToAppleMaps",
      "exportToBingPlaces",
      "exportToGoogleMapsPost",
      "exportToLinkedInNewsletter",
      "exportToMedium",
      "exportToNextdoor",
      "exportToOlxKenya",
      "exportToPigiaMe",
      "exportToReddit",
      "exportToSnapchat",
      "exportToYoutube"
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { [field]: value }
    });

    await writeAudit({
      action: "PRODUCT_EXPORT_BULK_UPDATE",
      entity: "PRODUCT",
      entityId: "multiple",
      userId,
      details: {
        productCount: ids.length,
        field,
        value,
        productIds: ids.slice(0, 50) // keep log manageable
      }
    });

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error("Bulk export update error:", error);
    return NextResponse.json({ error: "Failed to update export settings" }, { status: 500 });
  }
}
