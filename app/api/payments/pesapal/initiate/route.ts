import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { submitPesapalOrder, isPesapalConfigured } from "@/lib/pesapal";

const bodySchema = z.object({
  orderId: z.string(),
});

/**
 * POST /api/payments/pesapal/initiate
 * PesaPal v3: create order, create Payment record, return redirect URL for customer to pay (card/mobile).
 */
export async function POST(req: NextRequest) {
  if (!isPesapalConfigured()) {
    return NextResponse.json(
      { error: "PesaPal is not configured. Add PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, and PESAPAL_NOTIFICATION_ID." },
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
  if (order.status === "CONFIRMED" || order.status === "DELIVERED") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  const amount = Number(order.total);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl.replace(/\/$/, "")}/order-confirmation/${order.id}?pesapal=1`;
  const cancelUrl = `${appUrl.replace(/\/$/, "")}/checkout?cancel=1`;

  const notificationId = process.env.PESAPAL_NOTIFICATION_ID!.trim();
  const email = order.shippingAddress?.email ?? order.user?.email ?? "";
  const phone = order.shippingAddress?.phone ?? order.user?.phone ?? "";
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Order must have customer email or phone for PesaPal" },
      { status: 400 }
    );
  }

  const name = order.shippingAddress?.fullName ?? order.user?.name ?? "Customer";
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.length > 0 ? rest.join(" ") : "";

  try {
    const result = await submitPesapalOrder({
      id: order.orderNumber,
      currency: order.currency || "KES",
      amount,
      description: `PrintHub Order ${order.orderNumber}`.slice(0, 100),
      callback_url: callbackUrl,
      cancellation_url: cancelUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: email || undefined,
        phone_number: phone || undefined,
        country_code: "KE",
        first_name: first || "Customer",
        last_name: last || undefined,
        line_1: order.shippingAddress?.street?.slice(0, 100) || undefined,
        city: order.shippingAddress?.city || undefined,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "PESAPAL",
        amount: order.total,
        currency: order.currency || "KES",
        status: "PENDING",
        reference: order.orderNumber,
        providerTransactionId: result.order_tracking_id,
        pesapalRef: result.order_tracking_id,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: "CARD_PESAPAL",
        paymentStatus: "PROCESSING",
      },
    });

    return NextResponse.json({
      redirectUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id,
      paymentId: payment.id,
    });
  } catch (e) {
    console.error("PesaPal initiate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start PesaPal payment" },
      { status: 500 }
    );
  }
}
