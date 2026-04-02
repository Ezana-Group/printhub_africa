import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId") || "";
  
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/integrations/quickbooks/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "QuickBooks credentials not configured" }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    await prisma.oAuthToken.upsert({
      where: { provider: "quickbooks" },
      create: {
        provider: "quickbooks",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        businessName: "QuickBooks Connected",
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        businessName: "QuickBooks Connected",
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?success=quickbooks`);
  } catch (error: any) {
    console.error("QuickBooks callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?error=quickbooks&message=${encodeURIComponent(error.message)}`);
  }
}
