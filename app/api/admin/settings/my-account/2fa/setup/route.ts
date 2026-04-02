import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateSecret, generateURI } from "otplib";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const STAFF_OR_ADMIN = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/** POST: Generate a new TOTP secret for the current user. Returns secret + otpauth URL (do not save until verify). */
export async function POST() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, totpSecret: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.totpSecret) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: "PrintHub",
    label: user.email ?? undefined,
    secret,
  });

  return NextResponse.json({ secret, otpauthUrl });
}
