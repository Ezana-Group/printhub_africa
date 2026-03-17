/**
 * POST /api/account/settings/2fa/setup-method — Enable 2FA via email or SMS. Any authenticated user.
 * Body: { method: "email" | "sms" }. For SMS, user must have a phone number set.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({ method: z.enum(["email", "sms"]) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, totpSecret: true, twoFaMethod: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.totpSecret || user.twoFaMethod) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  if (parsed.data.method === "sms") {
    const phone = user.phone?.replace(/\D/g, "");
    if (!phone || phone.length < 9) {
      return NextResponse.json(
        { error: "Add a phone number in your profile before enabling SMS 2FA." },
        { status: 400 }
      );
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFaMethod: parsed.data.method,
      totpSecret: null,
      otpCodeHash: null,
      otpExpiresAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    method: parsed.data.method,
    message:
      parsed.data.method === "email"
        ? "2FA enabled. We'll send a code to your email when you sign in."
        : "2FA enabled. We'll send a code to your phone when you sign in.",
  });
}
