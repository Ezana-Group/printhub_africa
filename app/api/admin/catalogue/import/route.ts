import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { scrapeModelSource } from "@/lib/catalogue-scraper";
import { n8n } from "@/lib/n8n";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" }, req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL_REQUIRED" }, { status: 400 });
    }

    // 🔴 HIGH-2: SSRF Prevention
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.toLowerCase();
      
      const allowedDomains = ["thingiverse.com", "printables.com", "makerworld.com", "cults3d.com"];
      const isAllowed = allowedDomains.some(d => host === d || host.endsWith(`.${d}`));
      
      if (!isAllowed) {
        return NextResponse.json({ error: "UNSUPPORTED_DOMAIN", message: "Only Thingiverse, Printables, MakerWorld, and Cults3D are supported." }, { status: 400 });
      }
      
      if (parsedUrl.protocol !== "https:") {
        return NextResponse.json({ error: "INVALID_PROTOCOL", message: "Only HTTPS protocols are allowed." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "INVALID_URL", message: "The provided URL is not valid." }, { status: 400 });
    }

    // 1. Create CatalogueImportQueue entry immediately (PENDING)
    const importQueue = await prisma.catalogueImportQueue.create({
      data: {
        sourceUrl: url,
        status: "PENDING",
        aiEnhancementStatus: "processing"
      }
    });

    // 2. Start background processing (Scrape -> Update -> n8n)
    // We execute this without awaiting to return a response to the admin UI immediately.
    (async () => {
      try {
        console.log(`[Import] Starting background scrape for: ${url}`);
        const scrapedData = await scrapeModelSource(url);

        // Update the record with initial scraped data
        await prisma.catalogueImportQueue.update({
          where: { id: importQueue.id },
          data: {
            scrapedName: scrapedData.originalName,
            scrapedDescription: scrapedData.originalDescription,
            scrapedTags: scrapedData.originalTags,
            scrapedCategory: scrapedData.originalCategory,
            scrapedImageUrls: scrapedData.imageUrls,
            designerName: scrapedData.designerName,
            licenseType: scrapedData.licenseType,
            downloadCount: scrapedData.downloadCount,
            likeCount: scrapedData.likeCount,
            status: "PROCESSING", // Moved from PENDING to PROCESSING
          },
        });

        // 3. Trigger n8n enhancement workflow
        await n8n.catalogueImportEnhance({
          importId: importQueue.id,
          sourceUrl: url,
          platform: scrapedData.platform,
          originalName: scrapedData.originalName,
          originalDescription: scrapedData.originalDescription,
          originalTags: scrapedData.originalTags,
          imageUrls: (scrapedData.imageUrls || []).slice(0, 3),
          designerName: scrapedData.designerName,
          licenseType: scrapedData.licenseType,
          downloadCount: scrapedData.downloadCount,
          likeCount: scrapedData.likeCount
        });
        
        console.log(`[Import] Background process completed for: ${importQueue.id}`);
      } catch (bgError) {
        console.error(`[Import] Background error for ${importQueue.id}:`, bgError);
        await prisma.catalogueImportQueue.update({
          where: { id: importQueue.id },
          data: { 
            status: "FAILED", 
            aiEnhancementStatus: "failed" 
          },
        }).catch(() => {});
      }
    })();

    return NextResponse.json({ 
      success: true, 
      id: importQueue.id,
      message: "Import initiated. Data will appear once scraping and AI enhancement are complete."
    });
  } catch (error: unknown) {
    console.error('[CATALOGUE IMPORT ERROR]', error);
    return NextResponse.json({
      error: 'IMPORT_FAILED',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
