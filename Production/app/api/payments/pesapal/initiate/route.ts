import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement Pesapal v3 API
  // Register IPN, submit order, return redirect URL
  return NextResponse.json(
    { error: "Pesapal integration coming soon. Use M-Pesa for now." },
    { status: 501 }
  );
}
