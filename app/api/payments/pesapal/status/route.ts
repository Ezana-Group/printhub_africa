/**
 * GET /api/payments/pesapal/status
 * Polling fallback when user returns from PesaPal before IPN fires.
 * Verifies status via PesaPal GetTransactionStatus; never trusts client-supplied status.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";
import { decrementStockForOrder } from "@/lib/stock";

export async function GET(req: NextRequest) {
  const ip = getRateLimitClientIp(req) ?? "unknown";
  const { success } = await rateLimit(`pesapal-status:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const orderTrackingId = req.nextUrl.searchParams.get("orderTrackingId");
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderTrackingId?.trim() || !orderId?.trim()) {
    return NextResponse.json(
      { error: "Missing orderTrackingId or orderId" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptionsCustomer);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { where: { provider: "PESAPAL" }, orderBy: { createdAt: "desc" }, take: 1 },
      shippingAddress: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (session?.user?.id && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payment = order.payments[0];
  if (!payment) {
    return NextResponse.json({ status: "PENDING" });
  }
  if (payment.status === "COMPLETED") {
    return NextResponse.json({ status: "CONFIRMED", orderId: order.id });
  }

  try {
    const statusRes = await getPesapalTransactionStatus(orderTrackingId);
    const completed =
      statusRes.status_code === 1 ||
      (statusRes.payment_status_description ?? "").toUpperCase() === "COMPLETED";
    const failed =
      statusRes.status_code === 2 ||
      (statusRes.payment_status_description ?? "").toUpperCase() === "FAILED";

    if (completed) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          providerTransactionId: orderTrackingId,
          pesapalRef: orderTrackingId,
          pesapalStatus: "COMPLETED",
          paidAt: new Date(),
          providerResponse: statusRes as object,
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
      const email = order.shippingAddress?.email;
      if (email) {
        try {
          await sendOrderConfirmationEmail(
            email,
            order.orderNumber,
            Number(order.total),
            order.currency
          );
        } catch (e) {
          console.error("Order confirmation email failed:", e);
        }
      }
      try {
        await decrementStockForOrder(order.id);
      } catch (e) {
        console.error("Stock decrement on PesaPal status:", e);
      }
      try {
        const { awardLoyaltyPoints } = await import("@/lib/loyalty");
        await awardLoyaltyPoints(order.id);
        
        const { awardReferralPoints } = await import("@/lib/referrals");
        if (order.userId) await awardReferralPoints(order.userId, order.id);
      } catch (e) {
        console.error("Loyalty points award on PesaPal status:", e);
      }
      return NextResponse.json({ status: "CONFIRMED", orderId: order.id });
    }

    if (failed) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          pesapalStatus: "FAILED",
          providerResponse: statusRes as object,
        },
      });
      return NextResponse.json({ status: "FAILED" });
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (e) {
    console.error("PesaPal GetTransactionStatus error:", e);
    return NextResponse.json({ status: "PENDING" });
  }
}
