import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stkPush } from "@/lib/mpesa";
import { requireAdminApi } from "@/lib/admin-api-guard";

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
  return "254" + cleaned;
}

/** POST /api/admin/orders/[id]/resend-stk — trigger new M-Pesa STK push to order phone */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { mpesaTransaction: true },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const phone =
    order.payments[0]?.mpesaTransaction?.phoneNumber ??
    (order.shippingAddress?.phone
      ? normalizePhone(order.shippingAddress.phone)
      : null);
  if (!phone) {
    return NextResponse.json({ error: "No phone number for this order" }, { status: 400 });
  }

  const amount = Number(order.total);
  if (amount < 1) return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });

  try {
    const result = await stkPush(
      phone.startsWith("254") ? phone : `254${phone.replace(/^0/, "")}`,
      amount,
      order.orderNumber,
      `PrintHub Order ${order.orderNumber}`
    );

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "MPESA",
        amount: order.total,
        currency: "KES",
        status: "PENDING",
        reference: order.orderNumber,
      },
    });
    await prisma.mpesaTransaction.create({
      data: {
        paymentId: payment.id,
        phoneNumber: phone,
        merchantRequestId: result.MerchantRequestID,
        checkoutRequestId: result.CheckoutRequestID,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: result.CheckoutRequestID,
      message: result.CustomerMessage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "M-Pesa request failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
