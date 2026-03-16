import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET: Current user's 2FA status (any authenticated user — customer or staff). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, twoFaMethod: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const enabled = !!(user.totpSecret || user.twoFaMethod);
  const method = user.twoFaMethod ?? (user.totpSecret ? "totp" : null);

  return NextResponse.json({ enabled, method });
}
