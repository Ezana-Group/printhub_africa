import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("KES"),
  description: z.string().optional(),
  callbackUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * POST /api/payments/pesapal/initiate
 * Pesapal v3: create order, return redirect URL for customer to pay.
 * When implemented: use PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_IPN_URL.
 */
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!key || !secret) {
    return NextResponse.json(
      { error: "Pesapal not configured. Use M-Pesa or Paybill for now." },
      { status: 503 }
    );
  }
  // TODO: Pesapal v3 — get OAuth token, POST /orders, return redirect_url
  return NextResponse.json(
    { error: "Pesapal card payment is coming soon. Use M-Pesa or Paybill for now." },
    { status: 501 }
  );
}
