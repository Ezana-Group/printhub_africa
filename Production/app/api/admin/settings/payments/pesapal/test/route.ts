import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";

export async function POST(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  // TODO: Pesapal OAuth token request
  return NextResponse.json({ success: true });
}
