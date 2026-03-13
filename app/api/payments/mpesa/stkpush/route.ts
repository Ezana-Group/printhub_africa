import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stkPush } from "@/lib/mpesa";
import { checkMpesaHealth } from "@/lib/mpesa-health";
import { z } from "zod";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";

const schema = z.object({
  orderId: z.string(),
  phone: z.string().min(9),
});

const STKPUSH_LIMIT = 5;
const STKPUSH_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  const ip = getRateLimitClientIp(req) ?? "unknown";
  if (!rateLimit(`stkpush:${ip}`, STKPUSH_LIMIT, STKPUSH_WINDOW_MS).ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  await getServerSession(authOptions);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { orderId, phone } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CONFIRMED" || order.status === "DELIVERED") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  const amount = Number(order.total);
  if (amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const mpesaHealth = await checkMpesaHealth();
  if (!mpesaHealth.ok) {
    return NextResponse.json(
      { error: "M-Pesa is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  try {
    const result = await stkPush(
      phone,
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
        status: "PROCESSING",
        reference: order.orderNumber,
        mpesaCheckoutId: result.CheckoutRequestID,
        mpesaPhone: phone,
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

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "MPESA_STK",
        paymentStatus: "PROCESSING",
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
