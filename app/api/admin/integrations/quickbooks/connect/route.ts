import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/integrations/quickbooks/callback`;
  const scope = "com.intuit.quickbooks.accounting openid profile email phone address";

  if (!clientId) {
    return NextResponse.json({ error: "QUICKBOOKS_CLIENT_ID not configured" }, { status: 400 });
  }

  const url = `https://appcenter.intuit.com/connect/oauth2?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=quickbooks`;

  return NextResponse.redirect(url);
}
