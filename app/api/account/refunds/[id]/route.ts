/**
 * GET /api/account/refunds/[id] — refund detail (own orders only)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const refund = await prisma.refund.findFirst({
    where: { id, order: { userId: session.user.id } },
    include: {
      order: { select: { id: true, orderNumber: true } },
    },
  });
  if (!refund) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: refund.id,
    refundNumber: refund.refundNumber,
    orderId: refund.orderId,
    orderNumber: refund.order?.orderNumber,
    amount: Number(refund.amount),
    reason: refund.reason,
    status: refund.status,
    rejectionReason: refund.rejectionReason,
    processedAt: refund.processedAt?.toISOString() ?? null,
    createdAt: refund.createdAt.toISOString(),
  });
}
