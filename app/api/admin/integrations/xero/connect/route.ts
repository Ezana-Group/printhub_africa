import { requireAdminApi } from "@/lib/admin-api-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/integrations/xero/callback`;
  const scope = "offline_access openid profile email accounting.transactions accounting.settings accounting.contacts";

  if (!clientId) {
    return NextResponse.json({ error: "XERO_CLIENT_ID not configured" }, { status: 400 });
  }

  const url = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=xero`;

  return NextResponse.redirect(url);
}
