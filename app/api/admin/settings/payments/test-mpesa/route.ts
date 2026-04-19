import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { stkPush } from "@/lib/mpesa";
import { writeAudit } from "@/lib/audit";

/** POST: Trigger a test STK Push to a phone number. */
export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const { phone, amount = 1 } = await req.json().catch(() => ({}));

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required for STK Push test" }, { status: 400 });
    }

    const result = await stkPush(
      phone,
      amount,
      "TEST-SETTINGS",
      "PrintHub Settings Test"
    );

    await writeAudit({
      userId: auth.userId,
      action: "TEST_MPESA_STK_PUSH",
      entity: "SYSTEM",
      details: `STK Push test sent to ${phone}`,
      request: req
    });

    return NextResponse.json({ 
      success: true, 
      message: "STK Push initiated successfully", 
      merchantRequestId: result.MerchantRequestID,
      checkoutRequestId: result.CheckoutRequestID
    });
  } catch (error: any) {
    console.error("Test M-Pesa error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to initiate M-Pesa test" 
    }, { status: 500 });
  }
}
