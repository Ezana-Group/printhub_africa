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
    return NextResponse.json({
      mpesa: settings?.mpesaEnabled ?? true,
      stripe: settings?.stripeEnabled ?? false,
      pesapal: settings?.pesapalEnabled ?? false,
      flutterwave: settings?.flutterwaveEnabled ?? false,
    });
  } catch (e) {
    console.error("Payment methods error:", e);
    return NextResponse.json(
      { mpesa: true, stripe: false, pesapal: false, flutterwave: false },
      { status: 200 }
    );
  }
}
