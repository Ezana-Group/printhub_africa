import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId, photoId } = await params;

  const body = await req.json().catch(() => ({}));
  const { isPrimary, altText } = body as { isPrimary?: boolean; altText?: string };

  const photo = await prisma.catalogueItemPhoto.findFirst({
    where: { id: photoId, catalogueItemId: itemId },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: { isPrimary?: boolean; altText?: string | null } = {};
  if (typeof isPrimary === "boolean") update.isPrimary = isPrimary;
  if (typeof altText === "string") update.altText = altText;

  if (update.isPrimary === true) {
    await prisma.catalogueItemPhoto.updateMany({
      where: { catalogueItemId: itemId },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.catalogueItemPhoto.update({
    where: { id: photoId },
    data: update,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId, photoId } = await params;

  const photo = await prisma.catalogueItemPhoto.findFirst({
    where: { id: photoId, catalogueItemId: itemId },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.catalogueItemPhoto.delete({ where: { id: photoId } });

  const wasPrimary = photo.isPrimary;
  if (wasPrimary) {
    const next = await prisma.catalogueItemPhoto.findFirst({
      where: { catalogueItemId: itemId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.catalogueItemPhoto.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
