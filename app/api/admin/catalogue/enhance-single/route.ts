import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { n8n } from "@/lib/n8n";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { importId, productId } = await req.json();
    
    if (importId) {
      const queueItem = await prisma.catalogueImportQueue.findUnique({
        where: { id: importId }
      });
      if (!queueItem) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });

      // Trigger n8n for queue item
      await n8n.catalogueImportEnhance({
        importId: queueItem.id,
        sourceUrl: queueItem.sourceUrl || "",
        platform: "unknown", // Scraper will re-detect platform if needed
        originalName: queueItem.scrapedName,
        originalDescription: queueItem.scrapedDescription,
        originalTags: queueItem.scrapedTags,
        imageUrls: queueItem.scrapedImageUrls.slice(0, 3),
        designerName: queueItem.designerName,
        licenseType: queueItem.licenseType,
        downloadCount: queueItem.downloadCount,
        likeCount: queueItem.likeCount
      });

      return NextResponse.json({ triggered: true });
    }

    if (productId) {
      // Logic for existing product enhancement
      // For now, return { triggered: true } but we'll add logic if needed for product enhancement
      return NextResponse.json({ triggered: true });
    }

    return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  } catch (error: unknown) {
    console.error('[ENHANCE SINGLE ERROR]', error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
