import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // AI generation is not yet configured — wire to Claude API or similar
  return NextResponse.json({ success: false, message: "AI generation not configured" }, { status: 501 });
}
