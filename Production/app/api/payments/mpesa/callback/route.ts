import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTrackingEvent } from "@/lib/tracking";

/** Safaricom callback origin validation. Set to comma-separated IPs in production (e.g. from go-live docs). */
const MPESA_CALLBACK_IP_WHITELIST = process.env.MPESA_CALLBACK_IP_WHITELIST
  ? process.env.MPESA_CALLBACK_IP_WHITELIST.split(",").map((s) => s.trim()).filter(Boolean)
  : null;

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip") ?? null;
}

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

export async function POST(req: Request) {
  if (MPESA_CALLBACK_IP_WHITELIST && MPESA_CALLBACK_IP_WHITELIST.length > 0) {
    const clientIp = getClientIp(req);
    if (!clientIp || !MPESA_CALLBACK_IP_WHITELIST.includes(clientIp)) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized" }, { status: 403 });
    }
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
    const callbackAmount = Number(getVal("Amount") ?? 0);
    const date = String(getVal("TransactionDate") ?? "");

    const expectedAmount = Number(mpesa.payment.amount);
    const amountTolerance = 1;
    if (Math.abs(callbackAmount - expectedAmount) > amountTolerance) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: "Amount mismatch" },
        { status: 400 }
      );
    }

    const orderId = mpesa.payment.orderId;
    await prisma.$transaction([
      prisma.mpesaTransaction.update({
        where: { id: mpesa.id },
        data: {
          resultCode: String(stk.ResultCode),
          resultDesc: stk.ResultDesc,
          mpesaReceiptNumber: receipt,
          transactionDate: date,
          amount: callbackAmount,
        },
      }),
      prisma.payment.update({
        where: { id: mpesa.paymentId },
        data: { status: "COMPLETED", providerTransactionId: receipt, paidAt: new Date() },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      }),
    ]);
    await createTrackingEvent(orderId, "CONFIRMED");
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
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}
