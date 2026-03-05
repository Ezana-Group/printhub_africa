import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken, getResetPasswordExpiry } from "@/lib/tokens";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a reset link.",
      });
    }

    if (!user.passwordHash) {
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a reset link.",
      });
    }

    const token = generateToken();
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: { identifier: `reset:${email}`, token },
      },
      update: { token, expires: getResetPasswordExpiry() },
      create: {
        identifier: `reset:${email}`,
        token,
        expires: getResetPasswordExpiry(),
      },
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a reset link.",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
