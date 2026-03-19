import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { createTrackingEvent } from "@/lib/tracking";
import { restoreStockForOrder } from "@/lib/stock";
import { getNextRefundNumber } from "@/lib/next-invoice-number";

const refundSchema = z.object({
  amount: z.number().min(0.01),
  reason: z.string().max(500).optional(),
  markCompleted: z.boolean().optional(), // true when admin has already processed payout (e.g. M-Pesa B2C)
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ finance: true, needEdit: true });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { id: orderId } = await params;
  const body = await req.json();
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { amount, reason, markCompleted } = parsed.data;
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status === "REFUNDED") {
      return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
    }
    const totalPaid = order.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((s, p) => s + Number(p.amount), 0);
    if (amount > totalPaid) {
      return NextResponse.json(
        { error: { amount: ["Refund amount exceeds paid amount"] } },
        { status: 400 }
      );
    }
    const refundStatus = markCompleted ? "COMPLETED" : "PENDING";
    const refundNumber = await getNextRefundNumber();
    const refund = await prisma.refund.create({
      data: {
        orderId,
        refundNumber,
        amount,
        reason: reason ?? null,
        status: refundStatus,
        processedBy: session.user?.email ?? session.user?.id ?? undefined,
        processedAt: new Date(),
      },
    });
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: order.status,
        message: `Refund ${refundStatus === "COMPLETED" ? "processed" : "initiated"}: KES ${amount.toLocaleString()}${reason ? ` — ${reason}` : ""}`,
        updatedBy: session.user?.email ?? undefined,
      },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
      },
    });
    try {
      await restoreStockForOrder(orderId);
    } catch (e) {
      console.error("Stock restore on refund:", e);
    }
    await createTrackingEvent(orderId, "REFUNDED", {
      description: reason ?? `Refund of KES ${amount.toLocaleString()} has been processed.`,
      createdBy: session.user?.id,
    });
    return NextResponse.json({ refund });
  } catch (e) {
    console.error("Admin refund error:", e);
    return NextResponse.json({ error: "Failed to create refund" }, { status: 500 });
  }
}
