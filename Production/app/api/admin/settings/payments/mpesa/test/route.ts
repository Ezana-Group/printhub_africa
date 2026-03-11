import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    const authHeader =
      Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY ?? ""}:${process.env.MPESA_CONSUMER_SECRET ?? ""}`
      ).toString("base64");
    const base =
      process.env.MPESA_ENV === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
    const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authHeader}` },
    });
    if (!res.ok) throw new Error(`Safaricom returned ${res.status}`);
    return NextResponse.json({ success: true, environment: process.env.MPESA_ENV ?? "sandbox" });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Connection failed" },
      { status: 400 }
    );
  }
}
