import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (auth.session.user as any).id;

  try {
    const item = await prisma.catalogueItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.catalogueItem.update({
      where: { id },
      data: {
        status: CatalogueStatus.ARCHIVED,
        archivedById: userId,
        archivedAt: new Date(),
      },
    });

    await writeAudit({
      action: "CATALOGUE_ITEM_ARCHIVE",
      category: "CATALOGUE",
      userId: userId,
      entityId: id,
      details: `Archived item: ${item.name}`,
    });

    revalidateTag("catalogue");
    revalidatePath("/catalogue");
    if (updated.slug) revalidatePath(`/catalogue/${updated.slug}`);

    return NextResponse.json({ success: true, status: "ARCHIVED" });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_ARCHIVE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
