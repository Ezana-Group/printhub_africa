import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMpesaCallbackIpCheck } from "@/lib/mpesa-callback";
import { capturePaymentFailure, capturePaymentSuccess } from "@/lib/sentry-events";
import { createInvoiceForOrder } from "@/lib/invoice-create";
import { decrementStockForOrder } from "@/lib/stock";
import { addOrderToProductionQueue } from "@/lib/production-queue";
import { createTrackingEvent } from "@/lib/tracking";

interface CallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

import { withRateLimit } from "@/lib/rate-limit-wrapper";

/**
 * Security Validation:
 * - Uses `getMpesaCallbackIpCheck` which validates that incoming callbacks 
 *   originate from safaricom's IP whitelist (in production).
 * - Matches the CheckoutRequestID from the callback securely against 
 *   the pending `MpesaTransaction` in the database.
 */
async function _POST(req: Request) {
  const ipCheck = getMpesaCallbackIpCheck(req);
  if (!ipCheck.allowed && ipCheck.productionRequiresWhitelist) {
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: "MPESA_CALLBACK_IP_WHITELIST must be set in production" },
      { status: 503 }
    );
  }
  if (!ipCheck.allowed) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Forbidden" }, { status: 403 });
  }
  let body: CallbackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" }, { status: 400 });
  }

  const stk = body.Body?.stkCallback;
  if (!stk) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback" }, { status: 400 });
  }

  const mpesa = await prisma.mpesaTransaction.findFirst({
    where: { checkoutRequestId: stk.CheckoutRequestID },
    include: { payment: { include: { order: true } } },
  });

  if (!mpesa) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  }

  if (stk.ResultCode === 0 && stk.CallbackMetadata) {
    const items = stk.CallbackMetadata.Item;
    const getVal = (name: string) => items.find((i) => i.Name === name)?.Value;
    const receipt = String(getVal("MpesaReceiptNumber") ?? "");
    const amount = Number(getVal("Amount") ?? 0);
    const date = String(getVal("TransactionDate") ?? "");

    await prisma.$transaction([
      prisma.mpesaTransaction.update({
        where: { id: mpesa.id },
        data: {
          resultCode: String(stk.ResultCode),
          resultDesc: stk.ResultDesc,
          mpesaReceiptNumber: receipt,
          transactionDate: date,
          amount,
        },
      }),
      prisma.payment.update({
        where: { id: mpesa.paymentId },
        data: {
          status: "COMPLETED",
          providerTransactionId: receipt,
          mpesaReceiptNo: receipt,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: mpesa.payment.orderId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "CONFIRMED",
          paidAt: new Date(),
        },
      }),
    ]);
    capturePaymentSuccess({
      orderId: mpesa.payment.orderId,
      orderNumber: mpesa.payment.order.orderNumber,
      amount,
      mpesaRef: receipt,
    });
    try {
      await createInvoiceForOrder(mpesa.payment.orderId, mpesa.paymentId);
    } catch (e) {
      console.error("Invoice create on M-Pesa callback:", e);
    }
    try {
      await decrementStockForOrder(mpesa.payment.orderId);
    } catch (e) {
      console.error("Stock decrement on M-Pesa callback:", e);
    }
    try {
      await addOrderToProductionQueue(mpesa.payment.orderId);
    } catch (e) {
      console.error("Production queue add on M-Pesa callback:", e);
    }
    try {
      const { awardLoyaltyPoints } = await import("@/lib/loyalty");
      await awardLoyaltyPoints(mpesa.payment.orderId);
      
      const { awardReferralPoints } = await import("@/lib/referrals");
      const order = await prisma.order.findUnique({ where: { id: mpesa.payment.orderId }, select: { userId: true } });
      if (order?.userId) await awardReferralPoints(order.userId, mpesa.payment.orderId);
    } catch (e) {
      console.error("Loyalty points award on M-Pesa callback:", e);
    }
    
    // Trigger marketing and tracking events
    void createTrackingEvent(mpesa.payment.orderId, "CONFIRMED", {
      userData: {
        ip: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      }
    });
  } else {
    await prisma.mpesaTransaction.update({
      where: { id: mpesa.id },
      data: { resultCode: String(stk.ResultCode), resultDesc: stk.ResultDesc },
    });
    await prisma.payment.update({
      where: { id: mpesa.paymentId },
      data: { status: "FAILED", providerResponse: { ResultCode: stk.ResultCode, ResultDesc: stk.ResultDesc } },
    });
    await prisma.order.update({
      where: { id: mpesa.payment.orderId },
      data: { mpesaFailureReason: stk.ResultDesc },
    });
    capturePaymentFailure({
      orderId: mpesa.payment.orderId,
      orderNumber: mpesa.payment.order.orderNumber,
      amount: Number(mpesa.payment.amount),
      phone: mpesa.phoneNumber,
      reason: stk.ResultDesc,
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}

export const POST = withRateLimit(_POST, { limit: 100, windowMs: 60000, keyPrefix: "payment_webhook" });
