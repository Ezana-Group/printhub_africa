import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CatalogueSourceType, CatalogueLicense } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { parseUrlImport, downloadAndUploadImage } from "@/lib/import-utils";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL_REQUIRED" }, { status: 400 });
    }

    // Check for duplicates
    const existing = await prisma.catalogueItem.findFirst({
      where: {
        sourceUrl: url
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
      const status = (extracted as { status?: number }).status || 400;
      return NextResponse.json({ 
        error: extracted.error,
        detail: (extracted as { detail?: string }).detail 
      }, { status });
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

    // Generate unique slug
    const tsSlug = extracted.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let finalSlug = tsSlug;
    if (await prisma.catalogueItem.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${tsSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    // Map licenceType string
    let licenceEnum = "CC_BY";
    const lt = extracted.licenceType?.toUpperCase() || "";
    if (lt.includes("CC0") || lt.includes("PUBLIC DOMAIN")) licenceEnum = "CC0";
    else if (lt.includes("CC BY-SA")) licenceEnum = "CC_BY_SA";
    else if (lt.includes("CC BY") || lt.includes("ATTRIBUTION")) licenceEnum = "CC_BY";
    else if (lt.includes("ROYALTY") || lt.includes("COMMERCIAL")) licenceEnum = "PARTNERSHIP";
    else licenceEnum = "ORIGINAL";

    // Find default category
    let category = await prisma.category.findFirst({
      where: { slug: { in: ["3d-printing", "three-d-printing", "catalogue", "catalog"] } }
    });
    
    // Fallback if no specific category found
    if (!category) {
      category = await prisma.category.findFirst();
    }

    if (!category) {
      throw new Error("No categories found in database. Please create a category first.");
    }

    const catalogueItem = await prisma.catalogueItem.create({
      data: {
        name: extracted.name,
        slug: finalSlug,
        description: extracted.description,
        categoryId: category.id,
        sourceType: extracted.platform as CatalogueSourceType,
        sourceUrl: extracted.sourceUrl,
        licenseType: licenceEnum as CatalogueLicense,
        designerCredit: `${extracted.designerName || ""} ${extracted.designerUrl ? `(${extracted.designerUrl})` : ""}`.trim(),
        tags: extracted.tags || [],
        status: "PENDING_REVIEW",
        importedById: auth.session.user.id,
        photos: {
          create: uploadedImageUrls.map((u, i) => ({
            url: u,
            isPrimary: i === 0,
            sortOrder: i,
          }))
        }
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

    return NextResponse.json({ id: catalogueItem.id });
  } catch (error: unknown) {
    const body = await req.clone().json().catch(() => ({}));
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('[IMPORT URL ERROR]', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      url: body?.url,
    });
    
    let status = 500;
    if (errorMessage.includes("RATE_LIMITED")) status = 429;
    else if (errorMessage.includes("FETCH_FAILED") || errorMessage.includes("SERVICE_DOWN")) status = 503;
    else if (errorMessage.includes("AUTH_FAILED")) status = 401;

    return NextResponse.json({
      error: 'IMPORT_FAILED',
      detail: errorMessage,
      code: (error as { code?: string })?.code ?? null,
    }, { status });
  }
}
