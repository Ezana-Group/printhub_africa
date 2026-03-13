import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { NextResponse } from "next/server";

const MAX_SAVED_CARDS = 3;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cards = await prisma.savedCard.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ cards });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Card saving is not available. Use Pay with Card at checkout (PesaPal) to pay by card." },
      { status: 503 }
    );
  }

  let body: { paymentMethodId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const paymentMethodId = typeof body.paymentMethodId === "string" ? body.paymentMethodId.trim() : null;
  if (!paymentMethodId || !paymentMethodId.startsWith("pm_")) {
    return NextResponse.json({ error: "Missing or invalid paymentMethodId" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe unavailable" }, { status: 503 });

  try {
    const count = await prisma.savedCard.count({ where: { userId: session.user.id } });
    if (count >= MAX_SAVED_CARDS) {
      return NextResponse.json({ error: "Maximum number of saved cards (3) reached" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer. Try adding a card again." }, { status: 400 });
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== user.stripeCustomerId) {
      return NextResponse.json({ error: "Payment method does not belong to your account" }, { status: 400 });
    }
    if (pm.type !== "card" || !pm.card) {
      return NextResponse.json({ error: "Invalid card payment method" }, { status: 400 });
    }

    const isFirst = count === 0;
    const card = await prisma.savedCard.create({
      data: {
        userId: session.user.id,
        pesapalToken: `stripe:${paymentMethodId}`,
        last4: pm.card.last4,
        brand: pm.card.brand,
        expiryMonth: pm.card.exp_month,
        expiryYear: pm.card.exp_year,
        holderName: pm.billing_details?.name ?? null,
        isDefault: isFirst,
      },
    });

    return NextResponse.json({
      card: {
        id: card.id,
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        holderName: card.holderName,
        isDefault: card.isDefault,
      },
    });
  } catch (e) {
    console.error("Save card error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save card" },
      { status: 500 }
    );
  }
}
