import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns which payment methods are enabled (from BusinessSettings).
 * Used by checkout Step 3 to show only enabled options.
 */
export async function GET() {
  try {
    const settings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });
    const stripeOn = settings?.stripeEnabled ?? false;
    return NextResponse.json({
      mpesa: settings?.mpesaEnabled ?? true,
      airtelMoney: true,
      tkash: true,
      stripe: stripeOn,
      pesapal: settings?.pesapalEnabled ?? false,
      flutterwave: settings?.flutterwaveEnabled ?? false,
      applePay: stripeOn,
      googlePay: stripeOn,
    });
  } catch (e) {
    console.error("Payment methods error:", e);
    return NextResponse.json(
      { mpesa: true, airtelMoney: true, tkash: true, stripe: false, pesapal: false, flutterwave: false, applePay: false, googlePay: false },
      { status: 200 }
    );
  }
}
