import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

const bodySchema = z.object({
  orderId: z.string().min(1),
});

/**
 * POST /api/payments/stripe/create-intent
 * Creates a Stripe PaymentIntent for an order. Returns clientSecret for Stripe Elements / confirmCardPayment.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." },
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
    select: { id: true, total: true, currency: true, userId: true, orderNumber: true, paymentStatus: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.paymentStatus === "CONFIRMED") {
    return NextResponse.json({ error: "Order already paid" }, { status: 400 });
  }

  const amountKes = Number(order.total);
  if (!Number.isFinite(amountKes) || amountKes <= 0) {
    return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });
  }

  try {
    // Stripe KES is zero-decimal: amount is in whole KES
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountKes),
      currency: (order.currency || "kes").toLowerCase(),
      metadata: { orderId: order.id, orderNumber: order.orderNumber, printhubUserId: session.user.id },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (e) {
    console.error("Stripe create-intent error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
