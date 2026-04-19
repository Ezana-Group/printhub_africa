import { NextRequest, NextResponse } from "next/server";
import { authAdmin } from "@/lib/auth-admin";

/**
 * Health check for n8n instance.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await authAdmin(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const start = Date.now();
    const url = `${process.env.N8N_WEBHOOK_BASE_URL?.replace('/webhook', '')}/healthz` || 'https://n8n.printhub.africa/healthz';
    
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const responseMs = Date.now() - start;

    if (!res.ok) {
      return NextResponse.json({ status: "degraded", responseMs });
    }

    return NextResponse.json({ status: "ok", responseMs });
  } catch (err) {
    console.error("[n8n-health] n8n instance is down:", err);
    return NextResponse.json({ status: "down", responseMs: 0 });
  }
}
