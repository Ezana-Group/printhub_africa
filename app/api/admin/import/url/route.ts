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
      return NextResponse.json({ error: extracted.error }, { status: 400 });
    }

    // Download and upload images to R2
    const uploadedImageUrls: string[] = [];
    for (const imageUrl of extracted.imageUrls) {
      const r2Url = await downloadAndUploadImage(imageUrl);
      if (r2Url) uploadedImageUrls.push(r2Url);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    console.error("URL Import Error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", detail: err.message }, { status: 500 });
  }
}
