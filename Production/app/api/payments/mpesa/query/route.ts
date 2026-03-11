import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stkPushQuery } from "@/lib/mpesa";

export async function POST(req: Request) {
  const { checkoutRequestId } = (await req.json()) as { checkoutRequestId?: string };
  if (!checkoutRequestId) {
    return NextResponse.json({ error: "checkoutRequestId required" }, { status: 400 });
  }

  const mpesa = await prisma.mpesaTransaction.findFirst({
    where: { checkoutRequestId },
    include: { payment: true },
  });
  if (!mpesa) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  if (mpesa.payment.status === "COMPLETED") {
    return NextResponse.json({
      status: "COMPLETED",
      orderId: mpesa.payment.orderId,
      receipt: mpesa.mpesaReceiptNumber,
    });
  }
  if (mpesa.payment.status === "FAILED") {
    return NextResponse.json({ status: "FAILED", message: mpesa.resultDesc ?? "Payment failed" });
  }

  try {
    const result = await stkPushQuery(checkoutRequestId);
    if (result.ResultCode === "0") {
      await prisma.payment.update({
        where: { id: mpesa.paymentId },
        data: { status: "COMPLETED", paidAt: new Date() },
      });
      await prisma.order.update({
        where: { id: mpesa.payment.orderId },
        data: { status: "CONFIRMED" },
      });
      return NextResponse.json({
        status: "COMPLETED",
        orderId: mpesa.payment.orderId,
      });
    }
    return NextResponse.json({
      status: "PENDING",
      message: result.ResultDesc,
    });
  } catch {
    return NextResponse.json({
      status: mpesa.payment.status,
      message: "Still processing",
    });
  }
}
