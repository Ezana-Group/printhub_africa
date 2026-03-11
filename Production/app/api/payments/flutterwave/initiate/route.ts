import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement Flutterwave Standard/Inline
  return NextResponse.json(
    { error: "Flutterwave integration coming soon. Use M-Pesa for now." },
    { status: 501 }
  );
}
