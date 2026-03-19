import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Saved cards via Stripe are no longer supported. Card payments use PesaPal at checkout.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "Saved cards are no longer supported. Use PesaPal at checkout to pay by card." },
    { status: 410 }
  );
}
