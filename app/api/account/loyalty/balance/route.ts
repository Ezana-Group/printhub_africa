import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { getLoyaltyBalance } from "@/lib/loyalty";

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balance = await getLoyaltyBalance(session.user.id);
    return NextResponse.json(balance);
  } catch (e) {
    console.error("Loyalty balance fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
