import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { n8n } from "@/lib/n8n";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { importId, field } = await req.json();
    if (!importId || !field) {
      return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
    }

    const queueItem = await prisma.catalogueImportQueue.findUnique({
      where: { id: importId }
    });
    if (!queueItem) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });

    // Mark as processing so the UI shows loading
    await prisma.catalogueImportQueue.update({
      where: { id: importId },
      data: { aiEnhancementStatus: "processing" }
    });

    if (field === "descriptions") {
      await n8n.generateProductDescription({
        productId: importId, // We use importId as our reference here
        productName: queueItem.scrapedName || "Unnamed Model",
        imageUrls: queueItem.scrapedImageUrls.slice(0, 3),
        currentDescription: queueItem.scrapedDescription || ""
      });
    } else if (field === "seo") {
      await n8n.generateSeoContent({
        topic: queueItem.scrapedName || "3D Printed Model",
        keywords: queueItem.scrapedTags || [],
        productContext: true
      });
      // Note: SEO enhancement is more complex as it's general SEO. 
      // For specific catalogue items, we use the main enhancement usually.
    } else {
      // Default to main enhancement if field is name or everything
      await n8n.catalogueImportEnhance({
        importId: queueItem.id,
        sourceUrl: queueItem.sourceUrl || "",
        platform: "unknown",
        originalName: queueItem.scrapedName,
        originalDescription: queueItem.scrapedDescription,
        originalTags: queueItem.scrapedTags,
        imageUrls: queueItem.scrapedImageUrls.slice(0, 3),
        designerName: queueItem.designerName,
        licenseType: queueItem.licenseType,
        downloadCount: queueItem.downloadCount,
        likeCount: queueItem.likeCount
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[ENHANCE FIELD ERROR]', error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
