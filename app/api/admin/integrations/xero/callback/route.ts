import { prisma } from "@/lib/prisma";
import { requireAdminSettings } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/integrations/xero/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Xero credentials not configured" }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch("https://identity.xero.com/connect/token", {
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

    // Fetch tenant ID
    const tenantResponse = await fetch("https://api.xero.com/connections", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    const connections = await tenantResponse.json();
    const tenantId = connections[0]?.tenantId;
    const businessName = connections[0]?.tenantName || "Xero Connected";

    await prisma.oAuthToken.upsert({
      where: { provider: "xero" },
      create: {
        provider: "xero",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tenantId,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        businessName,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tenantId,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        businessName,
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?success=xero`);
  } catch (error: any) {
    console.error("Xero callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/integrations?error=xero&message=${encodeURIComponent(error.message)}`);
  }
}
