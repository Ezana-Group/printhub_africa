import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { deleteFile } from "@/lib/r2";
import { writeAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (auth.session.user as any).id;

  try {
    const item = await prisma.catalogueItem.findUnique({
      where: { id },
      include: { photos: true },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Cleanup R2 Assets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deletePromises: Promise<any>[] = [];

    // Photos
    for (const photo of item.photos) {
      if (photo.storageKey) {
        deletePromises.push(deleteFile("public", photo.storageKey));
      }
    }

    // Model file
    if (item.modelStorageKey) {
      deletePromises.push(deleteFile("private", item.modelStorageKey));
    }

    await Promise.allSettled(deletePromises);

    // 2. Hard delete from DB
    await prisma.catalogueItem.delete({ where: { id } });

    await writeAudit({
      action: "CATALOGUE_ITEM_DELETE_PERMANENT",
      category: "CATALOGUE",
      userId: userId,
      entityId: id,
      details: `Permanently deleted item: ${item.name}`,
    });

    revalidateTag("catalogue");
    revalidatePath("/catalogue");

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
