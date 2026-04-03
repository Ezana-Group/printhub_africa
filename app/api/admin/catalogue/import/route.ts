import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { scrapeModelSource } from "@/lib/catalogue-scraper";
import { n8n } from "@/lib/n8n";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL_REQUIRED" }, { status: 400 });
    }

    // 1. Scrape source page (Async/Best effort)
    const scrapedData = await scrapeModelSource(url);

    // 2. Create CatalogueImportQueue entry
    const importQueue = await prisma.catalogueImportQueue.create({
      data: {
        sourceUrl: url,
        scrapedName: scrapedData.originalName,
        scrapedDescription: scrapedData.originalDescription,
        scrapedTags: scrapedData.originalTags,
        scrapedCategory: scrapedData.originalCategory,
        scrapedImageUrls: scrapedData.imageUrls,
        designerName: scrapedData.designerName,
        licenseType: scrapedData.licenseType,
        downloadCount: scrapedData.downloadCount,
        likeCount: scrapedData.likeCount,
        status: "PENDING",
        aiEnhancementStatus: "processing"
      }
    });

    // 3. Trigger n8n enhancement workflow (non-blocking)
    n8n.catalogueImportEnhance({
      importId: importQueue.id,
      sourceUrl: url,
      platform: scrapedData.platform,
      originalName: scrapedData.originalName,
      originalDescription: scrapedData.originalDescription,
      originalTags: scrapedData.originalTags,
      imageUrls: scrapedData.imageUrls.slice(0, 3),
      designerName: scrapedData.designerName,
      licenseType: scrapedData.licenseType,
      downloadCount: scrapedData.downloadCount,
      likeCount: scrapedData.likeCount
    });

    return NextResponse.json({ 
      success: true, 
      id: importQueue.id,
      message: "Import started. AI enhancement is processing in the background."
    });
  } catch (error: unknown) {
    console.error('[CATALOGUE IMPORT ERROR]', error);
    return NextResponse.json({
      error: 'IMPORT_FAILED',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
