import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement Stripe Payment Intents
  return NextResponse.json(
    { error: "Stripe integration coming soon. Use M-Pesa for now." },
    { status: 501 }
  );
}
