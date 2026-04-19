/**
 * GET /api/account/refunds — list refunds for the current user's orders
 * POST /api/account/refunds — request a refund (creates PENDING; admin approves/rejects)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { getNextRefundNumber } from "@/lib/next-invoice-number";
import { z } from "zod";

const postSchema = z.object({
  orderId: z.string(),
  amount: z.number().min(0.01),
  reason: z.string().max(500).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const refunds = await prisma.refund.findMany({
    where: { order: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { id: true, orderNumber: true } },
    },
  });
  return NextResponse.json(
    refunds.map((r) => ({
      id: r.id,
      refundNumber: r.refundNumber,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      rejectionReason: r.rejectionReason,
      processedAt: r.processedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { orderId, amount, reason } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { payments: true, refunds: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Order is cancelled" }, { status: 400 });
  }
  const totalPaid = order.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + Number(p.amount), 0);
  const alreadyRefunded = order.refunds
    .filter((r) => r.status === "COMPLETED" || r.status === "APPROVED")
    .reduce((s, r) => s + Number(r.amount), 0);
  const maxRefund = totalPaid - alreadyRefunded;
  if (amount > maxRefund || maxRefund <= 0) {
    return NextResponse.json(
      { error: "Refund amount exceeds available amount" },
      { status: 400 }
    );
  }

  const refundNumber = await getNextRefundNumber();
  const refund = await prisma.refund.create({
    data: {
      orderId,
      refundNumber,
      amount,
      reason: reason ?? null,
      status: "PENDING",
    },
  });
  return NextResponse.json({
    id: refund.id,
    refundNumber: refund.refundNumber,
    status: refund.status,
    message: "Refund request submitted. We'll review and notify you.",
  });
}
