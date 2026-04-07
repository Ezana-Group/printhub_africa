import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { scrapeModelSource } from "@/lib/catalogue-scraper";
import { n8n } from "@/lib/n8n";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" }, req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { url: importUrl } = await req.json();
    if (!importUrl) {
      return NextResponse.json({ error: "URL_REQUIRED" }, { status: 400 });
    }

    const ALLOWED_IMPORT_DOMAINS = [
      'printables.com',
      'www.printables.com',
      'thingiverse.com',
      'www.thingiverse.com',
      'myminifactory.com',
      'www.myminifactory.com',
      'cults3d.com',
      'www.cults3d.com',
    ];

    const PRIVATE_IP_REGEX = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fe80:)/i;

    function validateImportUrl(url: string): { valid: boolean; reason?: string } {
      try {
        const parsed = new URL(url);

        if (parsed.protocol !== 'https:') {
          return { valid: false, reason: 'Only HTTPS URLs are permitted' };
        }

        if (PRIVATE_IP_REGEX.test(parsed.hostname)) {
          return { valid: false, reason: 'Internal/private IP addresses are not permitted' };
        }

        const isAllowed = ALLOWED_IMPORT_DOMAINS.some(
          (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
        );

        if (!isAllowed) {
          return { valid: false, reason: `Domain not in allowlist. Permitted: ${ALLOWED_IMPORT_DOMAINS.join(', ')}` };
        }

        return { valid: true };
      } catch {
        return { valid: false, reason: 'Invalid URL format' };
      }
    }

    const validation = validateImportUrl(importUrl);
    if (!validation.valid) {
      // Log the attempt for security monitoring
      // Log the attempt for security monitoring
      await prisma.auditLog.create({
        data: {
          userId: (auth.session.user as any).id,
          action: 'BLOCKED_IMPORT_URL',
          entity: 'CatalogueImport',
          after: JSON.stringify({ attemptedUrl: importUrl, reason: validation.reason }),
        },
      });
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // 1. Create CatalogueImportQueue entry immediately (PENDING)
    const importQueue = await prisma.catalogueImportQueue.create({
      data: {
        sourceUrl: importUrl,
        status: "PENDING",
        aiEnhancementStatus: "processing"
      }
    });

    // 2. Start background processing (Scrape -> Update -> n8n)
    // We execute this without awaiting to return a response to the admin UI immediately.
    (async () => {
      try {
        console.log(`[Import] Starting background scrape for: ${importUrl}`);
        const scrapedData = await scrapeModelSource(importUrl);

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

        /* 
        // 3. Trigger n8n enhancement workflow (DISABLED: Use manual trigger on Review Page)
        await n8n.catalogueImportEnhance({
          importId: importQueue.id,
          sourceUrl: importUrl,
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
        */
        
        await prisma.catalogueImportQueue.update({
          where: { id: importQueue.id },
          data: { aiEnhancementStatus: "idle" }
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
