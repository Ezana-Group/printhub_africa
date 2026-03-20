import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { parseUrlImport, downloadAndUploadImage, detectPlatform } from "@/lib/import-utils";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL_REQUIRED" }, { status: 400 });
    }

    const platform = detectPlatform(url);

    // Check for duplicates
    const existing = await prisma.externalModel.findFirst({
      where: {
        OR: [
          { platform, sourceUrl: url },
          { sourceUrl: url }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ 
        error: "ALREADY_IMPORTED", 
        existingId: existing.id 
      });
    }

    const extracted = await parseUrlImport(url);
    if ("error" in extracted) {
      return NextResponse.json({ 
        error: extracted.error,
        detail: (extracted as any).detail 
      }, { status: 400 });
    }

    // Download and upload images to R2 - NON-BLOCKING
    let uploadedImageUrls: string[] = [];
    const originalImageUrls: string[] = extracted.imageUrls;

    try {
      for (const imageUrl of originalImageUrls) {
        const r2Url = await downloadAndUploadImage(imageUrl);
        if (r2Url) uploadedImageUrls.push(r2Url);
      }
    } catch (imgError) {
      console.warn('[IMPORT] Image download failed, using original URLs', imgError);
      uploadedImageUrls = originalImageUrls; // fallback to source URLs
    }

    const thumbnailUrl = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null;

    const externalModel = await prisma.externalModel.create({
      data: {
        platform: extracted.platform,
        sourceUrl: extracted.sourceUrl,
        name: extracted.name,
        description: extracted.description,
        printInfo: extracted.printInfo,
        imageUrls: uploadedImageUrls,
        thumbnailUrl: thumbnailUrl,
        licenceType: extracted.licenceType,
        designerName: extracted.designerName,
        designerUrl: extracted.designerUrl,
        tags: extracted.tags,
        importedBy: auth.session.user.id,
        status: "PENDING_REVIEW",
      }
    });

    await prisma.importLog.create({
      data: {
        platform: extracted.platform,
        trigger: "manual_url",
        sourceUrl: url,
        resultCount: 1,
        status: "success",
        triggeredBy: auth.session.user.id,
      }
    });

    return NextResponse.json({ id: externalModel.id });
  } catch (error: unknown) {
    const body = await req.clone().json().catch(() => ({}));
    console.error('[IMPORT URL ERROR]', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: body?.url,
    });
    
    return NextResponse.json({
      error: 'IMPORT_FAILED',
      detail: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code ?? null,
    }, { status: 500 });
  }
}
