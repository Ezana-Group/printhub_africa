/**
 * GET /api/account/settings/2fa — Return 2FA status for the current user (any authenticated user).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, twoFaMethod: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const twoFaEnabled = !!(user.totpSecret || user.twoFaMethod);
  const twoFaMethod = user.twoFaMethod ?? (user.totpSecret ? "totp" : null);

  return NextResponse.json({ twoFaEnabled, twoFaMethod });
}
