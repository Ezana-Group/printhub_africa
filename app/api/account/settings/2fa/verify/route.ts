import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { verify } from "otplib";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d+$/, "Code must be digits only"),
  secret: z.string().min(1, "Secret is required"),
});

/** POST: Verify 6-digit code and save totpSecret for current user. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { code, secret } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, totpSecret: true, twoFaMethod: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.totpSecret || user.twoFaMethod) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
  }

  const result = await verify({ secret, token: code });
  if (!result.valid) {
    return NextResponse.json({ error: "Invalid or expired code. Try again." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret, twoFaMethod: "totp", otpCodeHash: null, otpExpiresAt: null },
  });

  return NextResponse.json({ success: true });
}
