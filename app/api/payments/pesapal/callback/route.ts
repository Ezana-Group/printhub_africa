import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPesapalTransactionStatus } from "@/lib/pesapal";
import { decrementStockForOrder } from "@/lib/stock";
import { createInvoiceForOrder } from "@/lib/invoice-create";
import { addOrderToProductionQueue } from "@/lib/production-queue";

/**
 * POST /api/payments/pesapal/callback
 * PesaPal IPN (Instant Payment Notification). Register this URL in PesaPal dashboard.
 * Fetches transaction status from PesaPal (IPN does not include status), then updates Payment + Order.
 *
 * SECURITY NOTES (SEC-001):
 * PesaPal IPN does not include a request signature. Protection layers applied here:
 *  1. The OrderTrackingId from the IPN body must match the trackingId already stored
 *     against this payment record in our database — prevents an attacker from
 *     sending a fake IPN with a foreign trackingId to trigger a false confirmation.
 *  2. Payment status is verified by calling PesaPal's GetTransactionStatus API —
 *     even if an attacker triggers this endpoint, the order is only confirmed when
 *     PesaPal's own server returns a COMPLETED status for that trackingId.
 *  3. Optional: set PESAPAL_CALLBACK_IP_WHITELIST (comma-separated IPs) to restrict
 *     which IPs may POST to this endpoint.
 */

function getPesapalCallbackIpCheck(req: NextRequest): boolean {
  const whitelist = process.env.PESAPAL_CALLBACK_IP_WHITELIST?.trim();
  if (!whitelist) return true; // not configured — skip check
  const ips = whitelist.split(",").map((s) => s.trim()).filter(Boolean);
  if (ips.length === 0) return true;
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0]?.trim() : req.headers.get("x-real-ip") ?? null;
  if (!clientIp) return false;
  return ips.some((ip) => clientIp === ip); // exact match only
}

export async function POST(req: NextRequest) {
  try {
    // Optional IP whitelist check (SEC-001)
    if (!getPesapalCallbackIpCheck(req)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const orderTrackingIdFromBody = body.OrderTrackingId ?? body.OrderId ?? body.TransactionId;
    const merchantRef =
      body.OrderMerchantReference ??
      body.MerchantReference ??
      body.reference ??
      body.OrderId ??
      orderTrackingIdFromBody;
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
    // Idempotency: already processed
    if (!payment || payment.status === "COMPLETED") {
      return NextResponse.json({ message: "OK" });
    }

    // SEC-001: Validate that the trackingId from the IPN body matches what we
    // already have stored. If we have a stored ref, it must match — we do NOT
    // blindly trust a trackingId supplied by an anonymous POST request.
    const storedTrackingId = payment.providerTransactionId ?? payment.pesapalRef;
    const trackingId = (() => {
      if (storedTrackingId) {
        // If we already have a stored trackingId, the IPN body must supply the same one.
        if (orderTrackingIdFromBody && orderTrackingIdFromBody !== storedTrackingId) {
          return null; // mismatch — potential spoofing attempt
        }
        return storedTrackingId;
      }
      // First IPN for this payment — accept the trackingId from the body
      return orderTrackingIdFromBody ?? null;
    })();

    if (!trackingId || typeof trackingId !== "string") {
      return NextResponse.json({ message: "OK" });
    }

    // IPN does not include payment status; verify with PesaPal's GetTransactionStatus
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
      // BUG-003: Run all post-payment steps — previously only stock decrement ran;
      // invoice creation and production queue were missing, causing silent failures.
      try {
        await createInvoiceForOrder(order.id, payment.id);
      } catch (e) {
        console.error("Invoice create on PesaPal callback:", e);
      }
      try {
        await decrementStockForOrder(order.id);
      } catch (e) {
        console.error("Stock decrement on PesaPal callback:", e);
      }
      try {
        await addOrderToProductionQueue(order.id);
      } catch (e) {
        console.error("Production queue add on PesaPal callback:", e);
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (e) {
    console.error("Pesapal IPN error:", e);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
