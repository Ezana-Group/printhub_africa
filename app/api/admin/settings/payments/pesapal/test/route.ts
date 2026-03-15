import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { getPesapalAccessToken, isPesapalConfigured } from "@/lib/pesapal";

/**
 * POST /api/admin/settings/payments/pesapal/test
 * Verifies PesaPal OAuth (RequestToken) and returns success/failure.
 */
export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  if (!isPesapalConfigured()) {
    return NextResponse.json(
      { success: false, error: "PesaPal is not configured. Set PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, and PESAPAL_NOTIFICATION_ID." },
      { status: 400 }
    );
  }

  try {
    await getPesapalAccessToken();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "PesaPal OAuth token request failed" },
      { status: 400 }
    );
  }
}
