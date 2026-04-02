/**
 * POST /api/admin/settings/my-account/pin/verify — Verify production floor PIN.
 * Body: { pin: string }. Returns { valid: true } or 400 with { valid: false, error }.
 * Used by production queue / shared device flows.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || !role || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Unauthorized", valid: false }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Invalid PIN", valid: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { productionPinHash: true },
  });
  if (!user?.productionPinHash) {
    return NextResponse.json({ error: "No PIN set. Set a PIN in My Account first.", valid: false }, { status: 400 });
  }

  const valid = await bcrypt.compare(pin, user.productionPinHash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect PIN", valid: false }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
