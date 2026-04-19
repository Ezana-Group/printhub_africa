import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();

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
    "exportToYoutube",
    "exportNotes"
  ];

  const updateData: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      select: { name: true }
    });

    await writeAudit({
      userId: auth.userId,
      action: "UPDATE_PRODUCT_EXPORT",
      entity: "PRODUCT",
      entityId: id,
      category: "MARKETING",
      targetType: "PRODUCT",
      targetId: id,
      after: updateData,
      request: req,
    });

    return NextResponse.json({ success: true, name: product.name });
  } catch (error) {
    console.error("Failed to update product export:", error);
    return NextResponse.json({ error: "Product not found or update failed" }, { status: 500 });
  }
}
