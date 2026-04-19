import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payments/mpesa/status?checkoutRequestId=...&orderId=...
 * Poll after STK push. Returns CONFIRMED | FAILED | PENDING and payment when confirmed.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
  const { searchParams } = new URL(req.url);
  const checkoutRequestId = searchParams.get("checkoutRequestId");
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.userId && order.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payment = order.payments[0] ?? null;
  if (checkoutRequestId && !payment?.mpesaCheckoutId) {
    const txn = await prisma.mpesaTransaction.findFirst({
      where: { checkoutRequestId },
      include: { payment: true },
    });
    if (txn && txn.payment.orderId === orderId) {
      payment = txn.payment;
    }
  }

  if (!payment) {
    return NextResponse.json({
      status: "PENDING",
      payment: null,
    });
  }

  if (payment.status === "COMPLETED") {
    return NextResponse.json({
      status: "CONFIRMED",
      payment: {
        id: payment.id,
        status: payment.status,
        mpesaReceiptNo: payment.mpesaReceiptNo,
        paidAt: payment.paidAt,
      },
    });
  }
  if (payment.status === "FAILED") {
    return NextResponse.json({
      status: "FAILED",
      payment: {
        id: payment.id,
        status: payment.status,
        failureReason: payment.failureReason,
      },
    });
  }

  return NextResponse.json({
    status: "PENDING",
    payment: null,
  });
}
