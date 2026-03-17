/** POST: Generate a new TOTP secret for the current user. Any authenticated user (including customers). */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateSecret, generateURI } from "otplib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
