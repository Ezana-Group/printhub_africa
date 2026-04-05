import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { decrementStockForOrder } from "@/lib/stock";
import { createTrackingEvent } from "@/lib/tracking";
import { withRateLimit } from "@/lib/rate-limit-wrapper";

/**
 * POST /api/payments/pesapal/callback
 * PesaPal IPN (Instant Payment Notification). Register this URL in PesaPal dashboard.
 * Fetches transaction status from PesaPal (IPN does not include status), then updates Payment + Order.
 *
 * Security Validation: 
 * - The raw IPN does not contain the payment status, preventing IPN spoofing.
 * - This endpoint uses the tracking ID from the IPN to query the Pesapal API securely.
 * - Only the Pesapal API response determines the order fulfillment status.
 */
async function _POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }
    const orderTrackingId = body.OrderTrackingId ?? body.OrderId ?? body.TransactionId;
    const merchantRef =
      body.OrderMerchantReference ??
      body.MerchantReference ??
      body.reference ??
      body.OrderId ??
      orderTrackingId;
    if (!merchantRef) {
      return NextResponse.json({ message: "Missing order reference" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { orderNumber: String(merchantRef) },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }
    const payment = order.payments[0];
    if (!payment || payment.status === "COMPLETED") {
      return NextResponse.json({ message: "OK" });
    }
    // IPN does not include payment status; fetch from PesaPal GetTransactionStatus
    const trackingId = orderTrackingId ?? payment.providerTransactionId ?? payment.pesapalRef;
    if (!trackingId || typeof trackingId !== "string") {
      return NextResponse.json({ message: "OK" });
    }
    let paid = false;
    try {
      const statusRes = await getPesapalTransactionStatus(trackingId);
      paid =
        statusRes.status_code === 1 ||
        (statusRes.payment_status_description ?? "").toUpperCase() === "COMPLETED";
    } catch (e) {
      console.error("Pesapal GetTransactionStatus error:", e);
    }
    if (paid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          providerTransactionId: trackingId,
          pesapalRef: trackingId,
          pesapalStatus: "COMPLETED",
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
      try {
        await decrementStockForOrder(order.id);
      } catch (e) {
        console.error("Stock decrement on PesaPal callback:", e);
      }

      try {
        const { awardLoyaltyPoints } = await import("@/lib/loyalty");
        await awardLoyaltyPoints(order.id);
        
        const { awardReferralPoints } = await import("@/lib/referrals");
        if (order.userId) await awardReferralPoints(order.userId, order.id);
      } catch (e) {
        console.error("Loyalty points award on PesaPal callback:", e);
      }
      
      // Trigger marketing and tracking events
      void createTrackingEvent(order.id, "CONFIRMED", {
        userData: {
          ip: req.headers.get("x-forwarded-for") || undefined,
          userAgent: req.headers.get("user-agent") || undefined,
        }
      });
    }
    return NextResponse.json({ message: "OK" });
  } catch (e) {
    console.error("Pesapal IPN error:", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export const POST = withRateLimit(_POST, { limit: 100, windowMs: 60000, keyPrefix: "payment_webhook" });
