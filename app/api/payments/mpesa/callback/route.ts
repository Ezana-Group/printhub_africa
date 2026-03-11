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

export async function POST(req: Request) {
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
        data: { status: "COMPLETED", providerTransactionId: receipt, paidAt: new Date() },
      }),
      prisma.order.update({
        where: { id: mpesa.payment.orderId },
        data: { status: "CONFIRMED" },
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
