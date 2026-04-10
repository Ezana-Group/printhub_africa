import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { publicFileUrl } from "@/lib/r2";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await ctx.params;

  const item = await prisma.catalogueItem.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { fileIds?: string[]; urls?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const fileIds = Array.isArray(body.fileIds) ? body.fileIds : [];
  const urls = Array.isArray(body.urls) ? body.urls : [];
  
  if (fileIds.length === 0 && urls.length === 0) {
    return NextResponse.json({ error: "fileIds or urls required" }, { status: 400 });
  }

  const files = fileIds.length > 0 ? await prisma.uploadedFile.findMany({
    where: { id: { in: fileIds } },
    select: { id: true, storageKey: true, url: true, bucket: true },
  }) : [];

  const existingCount = await prisma.catalogueItemPhoto.count({
    where: { catalogueItemId: id },
  });
  const maxNew = Math.max(0, 8 - existingCount);
  
  // Combine files and direct URLs
  const itemsToAdd: { url: string; storageKey: string | null }[] = [];
  
  for (const f of files) {
    const url = f.url ?? (f.storageKey && f.bucket === "public" ? publicFileUrl(f.storageKey) : null);
    if (url) itemsToAdd.push({ url, storageKey: f.storageKey });
  }
  
  for (const url of urls) {
    if (url.trim()) itemsToAdd.push({ url: url.trim(), storageKey: null });
  }

  const existingPhotos = await prisma.catalogueItemPhoto.findMany({
    where: { catalogueItemId: id },
    select: { storageKey: true, url: true }
  });
  
  const existingKeys = new Set(existingPhotos.map(p => p.storageKey).filter(Boolean));
  const existingUrls = new Set(existingPhotos.map(p => p.url));

  const toCreate = itemsToAdd.filter(item => 
    (item.storageKey && !existingKeys.has(item.storageKey)) || 
    (!item.storageKey && !existingUrls.has(item.url))
  ).slice(0, maxNew);
  
  const createdCount = toCreate.length;

  for (let i = 0; i < createdCount; i++) {
    const photoItem = toCreate[i];
    await prisma.catalogueItemPhoto.create({
      data: {
        catalogueItemId: id,
        url: photoItem.url,
        storageKey: photoItem.storageKey,
        sortOrder: existingCount + i,
        isPrimary: existingCount === 0 && i === 0,
      },
    });
  }

  // Link UploadedFile records to this catalogue item (if possible/needed)
  if (fileIds.length > 0) {
    try {
      await prisma.uploadedFile.updateMany({
        where: { id: { in: fileIds } },
        data: { uploadContext: "ADMIN_CATALOGUE_PHOTO" }
      });
    } catch (e) {
      console.error("Failed to update uploaded files context:", e);
    }
  }

  return NextResponse.json({
    success: true,
    added: createdCount,
  });
}
