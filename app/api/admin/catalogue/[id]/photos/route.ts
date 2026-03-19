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

  let body: { fileIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const fileIds = Array.isArray(body.fileIds) ? body.fileIds : [];
  if (fileIds.length === 0) {
    return NextResponse.json({ error: "fileIds required" }, { status: 400 });
  }

  const files = await prisma.uploadedFile.findMany({
    where: { id: { in: fileIds } },
    select: { id: true, storageKey: true, url: true, bucket: true },
  });

  const existingCount = await prisma.catalogueItemPhoto.count({
    where: { catalogueItemId: id },
  });
  const maxNew = Math.max(0, 8 - existingCount);
  const toCreate = files.slice(0, maxNew);

  const created: { url: string; storageKey: string | null }[] = [];
  for (let i = 0; i < toCreate.length; i++) {
    const f = toCreate[i];
    const url =
      f.url ??
      (f.storageKey && f.bucket === "public"
        ? publicFileUrl(f.storageKey)
        : null);
    if (!url) continue;
    await prisma.catalogueItemPhoto.create({
      data: {
        catalogueItemId: id,
        url,
        storageKey: f.storageKey,
        sortOrder: existingCount + i,
        isPrimary: existingCount === 0 && i === 0,
      },
    });
    created.push({ url, storageKey: f.storageKey });
  }

  return NextResponse.json({
    success: true,
    added: created.length,
  });
}
