import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string; photoId: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id, photoId } = await ctx.params;

  const photo = await prisma.catalogueItemPhoto.findFirst({
    where: { id: photoId, catalogueItemId: id },
  });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.catalogueItemPhoto.updateMany({
      where: { catalogueItemId: id },
      data: { isPrimary: false },
    }),
    prisma.catalogueItemPhoto.update({
      where: { id: photoId },
      data: { isPrimary: true },
    }),
  ]);
  return NextResponse.json({ success: true });
}
