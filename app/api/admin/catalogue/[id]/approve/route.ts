import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const { id } = await ctx.params;

  const item = await prisma.catalogueItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== CatalogueStatus.PENDING_REVIEW) {
    return NextResponse.json(
      { error: "Item is not pending review" },
      { status: 400 }
    );
  }

  const itemAfter = await prisma.catalogueItem.update({
    where: { id },
    data: {
      status: CatalogueStatus.LIVE,
      approvedBy: userId,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectionReason: null,
    },
    select: { slug: true },
  });
  revalidateTag("catalogue");
  revalidatePath("/catalogue");
  if (itemAfter.slug) revalidatePath(`/catalogue/${itemAfter.slug}`);
  return NextResponse.json({ success: true, status: "LIVE" });
}
