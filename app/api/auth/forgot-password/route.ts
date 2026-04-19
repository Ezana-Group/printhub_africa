import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken, getResetPasswordExpiry } from "@/lib/tokens";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

const FORGOT_PASSWORD_LIMIT = 3;
const FORGOT_PASSWORD_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  const ip = getRateLimitClientIp(req) ?? "unknown";
  const rl = await rateLimit(`forgot-password:${ip}`, { 
    limit: FORGOT_PASSWORD_LIMIT, 
    windowMs: FORGOT_PASSWORD_WINDOW_MS 
  });
  
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
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
