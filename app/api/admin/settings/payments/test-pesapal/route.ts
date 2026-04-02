import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { getPesapalAccessToken, getPesapalSettings } from "@/lib/pesapal";
import { writeAudit } from "@/lib/audit";

/** POST: Verify Pesapal configuration by requesting a token. */
export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await getPesapalSettings();
    const token = await getPesapalAccessToken();
    
    await writeAudit({
      userId: auth.userId,
      action: "TEST_PESAPAL_AUTH",
      entity: "SYSTEM",
      details: `Pesapal authentication test successful (${settings.env})`,
      request: req
    });

    return NextResponse.json({ 
      success: true, 
      message: "Pesapal credentials are valid", 
      env: settings.env,
      baseUrl: settings.baseUrl,
      token: token.slice(0, 10) + "..."
    });
  } catch (error: any) {
    console.error("Test PesaPal error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to authenticate with PesaPal" 
    }, { status: 500 });
  }
}
