import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PAYBILL = "522522";
const DEFAULT_TILL = "123456";

/**
 * Returns which payment methods are enabled and M-Pesa Paybill/Till (from BusinessSettings + adminSettings:payments).
 * Used by checkout and pay page.
 */
export async function GET() {
  try {
    const [businessSettings, paymentsConfig] = await Promise.all([
      prisma.businessSettings.findUnique({ where: { id: "default" } }),
      prisma.pricingConfig.findUnique({ where: { key: "adminSettings:payments" } }),
    ]);
    const stripeOn = businessSettings?.stripeEnabled ?? false;
    let mpesaPaybillNumber = DEFAULT_PAYBILL;
    let mpesaTillNumber = DEFAULT_TILL;
    if (paymentsConfig?.valueJson) {
      try {
        const data = JSON.parse(paymentsConfig.valueJson) as { mpesaPaybillNumber?: string; mpesaTillNumber?: string };
        if (typeof data.mpesaPaybillNumber === "string" && data.mpesaPaybillNumber.trim()) {
          mpesaPaybillNumber = data.mpesaPaybillNumber.trim();
        }
        if (typeof data.mpesaTillNumber === "string" && data.mpesaTillNumber.trim()) {
          mpesaTillNumber = data.mpesaTillNumber.trim();
        }
      } catch {
        // ignore
      }
    }
    return NextResponse.json({
      mpesa: businessSettings?.mpesaEnabled ?? true,
      airtelMoney: true,
      tkash: true,
      stripe: stripeOn,
      pesapal: businessSettings?.pesapalEnabled ?? false,
      flutterwave: businessSettings?.flutterwaveEnabled ?? false,
      applePay: stripeOn,
      googlePay: stripeOn,
      mpesaPaybillNumber,
      mpesaTillNumber,
    });
  } catch (e) {
    console.error("Payment methods error:", e);
    return NextResponse.json(
      { mpesa: true, airtelMoney: true, tkash: true, stripe: false, pesapal: false, flutterwave: false, applePay: false, googlePay: false, mpesaPaybillNumber: DEFAULT_PAYBILL, mpesaTillNumber: DEFAULT_TILL },
      { status: 200 }
    );
  }
}
