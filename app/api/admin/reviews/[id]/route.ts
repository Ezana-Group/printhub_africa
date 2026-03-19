import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";

const updateSchema = z.object({
  isApproved: z.boolean().optional(),
});

/**
 * PATCH /api/admin/reviews/[id] — approve or reject review
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const review = await prisma.productReview.findUnique({ where: { id } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  await prisma.productReview.update({
    where: { id },
    data: { isApproved: parsed.data.isApproved ?? review.isApproved },
  });
  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/reviews/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  await prisma.productReview.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
