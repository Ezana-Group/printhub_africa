import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { downloadAndUploadImage } from "@/lib/import-utils";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { 
      url, 
      name, 
      description, 
      printInfo, 
      imageUrls, 
      licenceType, 
      designerName, 
      designerUrl, 
      platform,
      sourceUrl 
    } = body;

    if (!name || (!url && !sourceUrl)) {
      return NextResponse.json({ error: "NAME_AND_URL_REQUIRED" }, { status: 400 });
    }

    const finalUrl = sourceUrl || url;

    // Download and upload images to R2 - NON-BLOCKING
    let uploadedImageUrls: string[] = [];
    const originalImageUrls: string[] = imageUrls || [];

    try {
      if (originalImageUrls.length > 0) {
        for (const imgUrl of originalImageUrls) {
          const r2Url = await downloadAndUploadImage(imgUrl);
          if (r2Url) uploadedImageUrls.push(r2Url);
        }
      }
    } catch (imgError) {
      console.warn('[IMPORT] Manual image download failed, using original URLs', imgError);
      uploadedImageUrls = originalImageUrls;
    }

    const thumbnailUrl = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null;

    // @ts-ignore - Prisma might be out of sync in IDE
    const externalModel = await prisma.externalModel.create({
      data: {
        platform: platform || "OTHER",
        sourceUrl: finalUrl,
        name,
        description,
        printInfo,
        imageUrls: uploadedImageUrls,
        thumbnailUrl: thumbnailUrl,
        licenceType: licenceType || "Unknown",
        designerName: designerName || "Unknown",
        designerUrl: designerUrl || "",
        tags: [],
        importedBy: auth.session.user.id,
        status: "PENDING_REVIEW",
      }
    });

    // @ts-ignore - Prisma might be out of sync in IDE
    await prisma.importLog.create({
      data: {
        platform: platform || "OTHER",
        trigger: "manual_url",
        sourceUrl: finalUrl,
        resultCount: 1,
        status: "success",
        triggeredBy: auth.session.user.id,
      }
    });

    return NextResponse.json({ id: externalModel.id });
  } catch (error: unknown) {
    console.error('[IMPORT MANUAL ERROR]', error);
    return NextResponse.json({
      error: 'IMPORT_FAILED',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
