/**
 * /api/admin/whatsapp/[...path]
 *
 * Proxy for the standalone WhatsApp Express service.
 * Requires an active admin session — forwards the request to the
 * WhatsApp service using INTERNAL_SECRET for service-to-service auth.
 *
 * Examples:
 *   GET  /api/admin/whatsapp/conversations
 *     → GET  WHATSAPP_SERVICE_URL/api/inbox/conversations
 *   GET  /api/admin/whatsapp/conversations/254712345678
 *     → GET  WHATSAPP_SERVICE_URL/api/inbox/conversations/254712345678
 *   POST /api/admin/whatsapp/send
 *     → POST WHATSAPP_SERVICE_URL/api/inbox/send
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL?.replace(/\/$/, "");
const INTERNAL_SECRET      = process.env.INTERNAL_SECRET;
const ADMIN_ROLES          = ["STAFF", "ADMIN", "SUPER_ADMIN"];

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptionsAdmin);
  const user    = session?.user as any;
  if (!session?.user || !ADMIN_ROLES.includes(user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── WhatsApp service must be configured ───────────────────────────────────
  if (!WHATSAPP_SERVICE_URL) {
    return NextResponse.json(
      { error: "WHATSAPP_SERVICE_URL is not configured in env vars" },
      { status: 503 }
    );
  }
  if (!INTERNAL_SECRET) {
    return NextResponse.json(
      { error: "INTERNAL_SECRET is not configured in env vars" },
      { status: 503 }
    );
  }

  // ── Build upstream URL ────────────────────────────────────────────────────
  const { path } = await params;
  const upstreamPath = path.join("/");
  const search       = req.nextUrl.search || "";
  const upstreamUrl  = `${WHATSAPP_SERVICE_URL}/api/inbox/${upstreamPath}${search}`;

  // ── Forward request ───────────────────────────────────────────────────────
  try {
    const body = req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTERNAL_SECRET}`,
      },
      body,
      // Next.js cache: never cache proxy responses
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    console.error("[WhatsApp proxy] upstream error:", err.message);
    return NextResponse.json(
      { error: "WhatsApp service unreachable. Is it running?" },
      { status: 502 }
    );
  }
}

export const GET    = handler;
export const POST   = handler;
export const PATCH  = handler;
export const DELETE = handler;
