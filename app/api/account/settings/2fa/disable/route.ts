import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const bodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
});

/** POST: Disable 2FA for current user. Requires current password. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    const msg = body.error.flatten().fieldErrors.currentPassword?.[0] ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, totpSecret: true, twoFaMethod: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.totpSecret && !user.twoFaMethod) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }
  if (!user.passwordHash || !(await bcrypt.compare(body.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totpSecret: null,
      twoFaMethod: null,
      otpCodeHash: null,
      otpExpiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
