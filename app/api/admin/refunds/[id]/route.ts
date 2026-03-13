/**
 * PATCH /api/admin/refunds/[id] — approve or reject a refund request
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { sendRefundApprovedEmail, sendRefundRejectedEmail } from "@/lib/email";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ finance: true, needEdit: true });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const refund = await prisma.refund.findUnique({
    where: { id },
    include: { order: { select: { orderNumber: true, user: { select: { email: true } }, shippingAddress: { select: { email: true } } } } },
  });
  const customerEmail = refund?.order?.user?.email ?? refund?.order?.shippingAddress?.email;
  const orderNumber = refund?.order?.orderNumber ?? "";
  const amountKes = refund ? Number(refund.amount) : 0;
  const refundNum = refund?.refundNumber ?? id;
  if (!refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  if (refund.status !== "PENDING") {
    return NextResponse.json({ error: "Refund is not pending" }, { status: 400 });
  }

  const reviewedBy = (session.user?.email as string) ?? session.user?.id ?? undefined;
  if (parsed.data.action === "reject") {
    await prisma.refund.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.rejectionReason ?? null,
        reviewedBy,
      },
    });
    if (customerEmail) {
      sendRefundRejectedEmail(customerEmail, refundNum, orderNumber, parsed.data.rejectionReason ?? null).catch((e) =>
        console.error("Refund rejected email error:", e)
      );
    }
    return NextResponse.json({ success: true, status: "REJECTED" });
  }

  await prisma.refund.update({
    where: { id },
    data: {
      status: "APPROVED",
      rejectionReason: null,
      reviewedBy,
    },
  });
  if (customerEmail) {
    sendRefundApprovedEmail(customerEmail, refundNum, orderNumber, amountKes).catch((e) =>
      console.error("Refund approved email error:", e)
    );
  }
  return NextResponse.json({ success: true, status: "APPROVED" });
}
