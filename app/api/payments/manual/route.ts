import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import {
  sendPaymentReceivedEmail,
  sendEmail,
} from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
  method: z.enum(["MPESA_PAYBILL", "MPESA_TILL"]),
  reference: z.string().min(1),
  amountKes: z.number().positive(),
  proofFileId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsCustomer);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { orderId, method, reference, amountKes, proofFileId } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true, payments: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isOwner =
    session?.user?.id && order.userId === session.user.id;
  const guestEmail = order.shippingAddress?.email;
  if (!isOwner && !guestEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isOwner === false && session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "CONFIRMED" || order.status === "DELIVERED") {
    return NextResponse.json(
      { error: "Order already paid" },
      { status: 400 }
    );
  }

  let paybillNumber: string | undefined = "522522";
  let tillNumber: string | undefined = "123456";
  const paymentsConfig = await prisma.pricingConfig.findUnique({
    where: { key: "adminSettings:payments" },
  });
  if (paymentsConfig?.valueJson) {
    try {
      const data = JSON.parse(paymentsConfig.valueJson) as { mpesaPaybillNumber?: string; mpesaTillNumber?: string };
      if (typeof data.mpesaPaybillNumber === "string" && data.mpesaPaybillNumber.trim()) {
        paybillNumber = data.mpesaPaybillNumber.trim();
      }
      if (typeof data.mpesaTillNumber === "string" && data.mpesaTillNumber.trim()) {
        tillNumber = data.mpesaTillNumber.trim();
      }
    } catch {
      // ignore
    }
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "MPESA",
      amount: amountKes,
      currency: "KES",
      status: "AWAITING_CONFIRMATION",
      reference: order.orderNumber,
      manualReference: reference,
      proofFileId: proofFileId ?? undefined,
      paybillNumber: method === "MPESA_PAYBILL" ? paybillNumber : undefined,
      tillNumber: method === "MPESA_TILL" ? tillNumber : undefined,
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentMethod: method,
      paymentStatus: "AWAITING_CONFIRMATION",
    },
  });

  const customerEmail =
    guestEmail ?? (session?.user?.email as string | undefined);
  if (customerEmail) {
    await sendPaymentReceivedEmail(
      customerEmail,
      order.orderNumber,
      reference,
      method === "MPESA_PAYBILL" ? "Paybill" : "Till"
    );
  }

  const notifyEmail = process.env.ADMIN_EMAIL ?? process.env.NOTIFY_EMAIL;
  if (notifyEmail) {
    await sendEmail({
      to: notifyEmail,
      subject: `[PrintHub] Manual payment to confirm – ${order.orderNumber}`,
      text: `Order ${order.orderNumber}: ${method}, reference ${reference}, KSh ${amountKes}. Customer: ${customerEmail ?? "N/A"}. Confirm in admin.`,
    });
  }

  return NextResponse.json({
    success: true,
    payment: {
      id: payment.id,
      status: payment.status,
      manualReference: payment.manualReference,
    },
    message: "Payment submitted. We will confirm within 30 minutes.",
  });
}
