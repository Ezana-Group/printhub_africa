import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) return NextResponse.json({ success: false, error: "FLUTTERWAVE_SECRET_KEY not set" }, { status: 400 });
  try {
    const res = await fetch("https://api.flutterwave.com/v3/banks/KE", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`Flutterwave returned ${res.status}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Connection failed" },
      { status: 400 }
    );
  }
}
