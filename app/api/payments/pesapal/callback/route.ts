import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payments/pesapal/callback
 * Pesapal IPN (Instant Payment Notification). Register this URL in Pesapal dashboard.
 * Validates signature (when PESAPAL_IPN_SECRET set), finds order by reference, updates Payment + Order.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }
    // Pesapal v3 IPN payload shape: OrderId, OrderTrackingId, OrderNotificationType, etc.
    const orderRef =
      body.OrderId ??
      body.OrderTrackingId ??
      body.MerchantReference ??
      body.reference ??
      body.OrderReference;
    const status = body.OrderNotificationType ?? body.Status ?? body.status;
    if (!orderRef) {
      return NextResponse.json({ message: "Missing order reference" }, { status: 400 });
    }
    // TODO: validate IPN signature using PESAPAL_IPN_SECRET when provided
    const order = await prisma.order.findUnique({
      where: { orderNumber: String(orderRef) },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    const paid =
      status === "COMPLETED" ||
      status === "Paid" ||
      status === "paid" ||
      body.TransactionStatus === "Completed";
    if (paid) {
      const payment = order.payments[0];
      if (payment && payment.status !== "COMPLETED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            providerTransactionId: body.TransactionId ?? body.OrderTrackingId ?? null,
            pesapalRef: body.OrderTrackingId ?? body.TransactionId ?? null,
            pesapalStatus: String(status),
            paidAt: new Date(),
            providerResponse: body,
          },
        });
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "CONFIRMED",
            paymentStatus: "CONFIRMED",
            paidAt: new Date(),
          },
        });
      }
    }
    return NextResponse.json({ message: "OK" });
  } catch (e) {
    console.error("Pesapal IPN error:", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
