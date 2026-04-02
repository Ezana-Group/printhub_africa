import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().min(1).max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const session = await getServerSession(authOptionsAdmin);
  const userId = session?.user?.id ?? null;
  const { id } = await ctx.params;

  let reason = "";
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (parsed.success && parsed.data.reason) reason = parsed.data.reason;
  } catch {
    // optional body
  }

  const item = await prisma.catalogueItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== CatalogueStatus.PENDING_REVIEW) {
    return NextResponse.json(
      { error: "Item is not pending review" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    status: CatalogueStatus.DRAFT,
    rejectedById: userId,
    rejectedAt: new Date(),
    rejectionReason: reason || null,
    approvedById: null,
    approvedAt: null,
  };

  await prisma.catalogueItem.update({
    where: { id },
    data,
  });
  return NextResponse.json({ success: true, status: "DRAFT" });
}
