/**
 * POST /api/payments/mpesa/b2c-callback — Safaricom B2C result callback
 * Set MPESA_B2C_RESULT_URL to this route (e.g. https://yourapp.com/api/payments/mpesa/b2c-callback)
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRefundProcessedEmail } from "@/lib/email";

interface B2CCallbackBody {
  Result?: {
    ResultType?: number;
    ResultCode?: number;
    ResultDesc?: string;
    OriginatorConversationID?: string;
    ConversationID?: string;
    ResultParameters?: {
      ResultParameter?: Array<{ Key: string; Value: string | number }>;
    };
  };
}

function getParam(params: Array<{ Key: string; Value: string | number }> | undefined, key: string): string | number | undefined {
  if (!params) return undefined;
  const p = params.find((x) => x.Key === key);
  return p?.Value;
}

export async function POST(req: Request) {
  let body: B2CCallbackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" }, { status: 400 });
  }

  const result = body.Result;
  const conversationId = result?.ConversationID;
  const resultCode = result?.ResultCode ?? -1;
  const params = result?.ResultParameters?.ResultParameter;
  const receipt = getParam(params, "TransactionReceipt");
  const receiptNo = typeof receipt === "string" ? receipt : receipt != null ? String(receipt) : null;

  if (!conversationId) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  }

  const refund = await prisma.refund.findFirst({
    where: { mpesaConversationId: conversationId },
    include: { order: { select: { orderNumber: true, user: { select: { email: true } }, shippingAddress: { select: { email: true } } } } },
  });
  if (!refund) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  }

  if (resultCode === 0) {
    await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: "COMPLETED",
        mpesaReceiptNo: receiptNo ?? undefined,
        processedAt: new Date(),
      },
    });
    const customerEmail = refund.order?.user?.email ?? refund.order?.shippingAddress?.email;
    if (customerEmail) {
      sendRefundProcessedEmail(
        customerEmail,
        refund.refundNumber ?? refund.id,
        refund.order.orderNumber,
        Number(refund.amount),
        receiptNo ?? undefined
      ).catch((e) => console.error("Refund processed email error:", e));
    }
  } else {
    await prisma.refund.update({
      where: { id: refund.id },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}
