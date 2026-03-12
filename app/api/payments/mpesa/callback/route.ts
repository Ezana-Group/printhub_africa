import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { capturePaymentFailure, capturePaymentSuccess } from "@/lib/sentry-events";

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

/** Safaricom callback IP whitelist (comma-separated). Empty = allow all (sandbox). */
function isAllowedCallbackIp(req: Request): boolean {
  const whitelist = process.env.MPESA_CALLBACK_IP_WHITELIST?.trim();
  if (!whitelist) return true; // sandbox: allow all
  const ips = whitelist.split(",").map((s) => s.trim()).filter(Boolean);
  if (ips.length === 0) return true;
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0]?.trim() : req.headers.get("x-real-ip") ?? null;
  if (!clientIp) return false;
  return ips.some((ip) => clientIp === ip || clientIp.startsWith(ip));
}

export async function POST(req: Request) {
  if (!isAllowedCallbackIp(req)) {
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
