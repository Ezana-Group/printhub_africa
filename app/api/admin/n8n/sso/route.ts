import { NextRequest, NextResponse } from "next/server";
import { authAdmin } from "@/lib/auth-admin";
import jwt from "jsonwebtoken";

const N8N_ENCRYPTION_KEY = process.env.N8N_ENCRYPTION_KEY;
const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL || "https://n8n.printhub.africa";

/**
 * SSO handler for n8n access.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await authAdmin(req);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (session.role === "STAFF") {
      return new Response("Automation access requires Admin role", { status: 403 });
    }

    if (!N8N_ENCRYPTION_KEY) {
      console.error("[n8n-sso] N8N_ENCRYPTION_KEY not set");
      return new Response("Server configuration error", { status: 500 });
    }

    // Generate short-lived JWT (15 min)
    const token = jwt.sign(
      {
        email: session.email,
        name: session.name,
        role: session.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 mins
      },
      N8N_ENCRYPTION_KEY
    );

    const redirectUrl = `${N8N_URL}/sso/jwt?token=${token}&returnUrl=/workflows`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[n8n-sso] SSO error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
