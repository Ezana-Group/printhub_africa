import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

function isFlutterwaveConfigured(): boolean {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

/**
 * POST /api/payments/flutterwave/initiate
 * Creates a Flutterwave Standard payment and returns the redirect URL for the customer to pay (card/M-Pesa/etc).
 */
export async function POST(req: NextRequest) {
  if (!isFlutterwaveConfigured()) {
    return NextResponse.json(
      { error: "Flutterwave is not configured. Add FLUTTERWAVE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }
  const { orderId } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shippingAddress: true, user: { select: { email: true, name: true, phone: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "CONFIRMED" || order.paymentStatus === "CONFIRMED") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUrl = `${appUrl.replace(/\/$/, "")}/order-confirmation/${order.id}?flutterwave=1`;
  const txRef = `PHUB-${order.orderNumber}-${Date.now()}`;
  const email = order.shippingAddress?.email ?? order.user?.email ?? "customer@printhub.africa";
  const name = order.shippingAddress?.fullName ?? order.user?.name ?? "Customer";

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Math.round(amount * 100) / 100,
        currency: order.currency || "KES",
        redirect_url: redirectUrl,
        customer: {
          email,
          name: name?.slice(0, 100) || "Customer",
          phone_number: order.shippingAddress?.phone ?? order.user?.phone ?? undefined,
        },
        customizations: {
          title: "PrintHub Africa",
          description: `Order ${order.orderNumber}`.slice(0, 100),
        },
      }),
    });

    const data = (await res.json()) as {
      status?: string;
      message?: string;
      data?: { link?: string; id?: number };
    };

    if (!res.ok || data.status !== "success" || !data.data?.link) {
      return NextResponse.json(
        { error: data.message ?? `Flutterwave returned ${res.status}` },
        { status: 500 }
      );
    }

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "FLUTTERWAVE",
        amount: order.total,
        currency: order.currency || "KES",
        status: "PENDING",
        reference: order.orderNumber,
        providerTransactionId: String(data.data.id ?? txRef),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "CARD_FLUTTERWAVE",
        paymentStatus: "PROCESSING",
      },
    });

    return NextResponse.json({
      redirectUrl: data.data.link,
      txRef,
      paymentId: data.data.id,
    });
  } catch (e) {
    console.error("Flutterwave initiate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start Flutterwave payment" },
      { status: 500 }
    );
  }
}
