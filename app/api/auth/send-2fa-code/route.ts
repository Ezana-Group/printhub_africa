/**
 * POST /api/auth/send-2fa-code — Send 6-digit code to user's email or phone (for /login/verify page).
 * Body: { token, method: "email" | "sms" }. Token from validate-login. Sends code and stores hash in user.
 */
import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTwoFaToken } from "@/lib/twofa-token";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // SEC-003: Rate limit — 5 requests per 60 s per IP to prevent OTP brute-force and SMS bombing
    const ip = getRateLimitClientIp(req) ?? "global";
    const rl = await rateLimit(`send-2fa-code:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests. Please wait and try again." }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const method = body.method === "email" ? "email" : body.method === "sms" ? "sms" : null;
    if (!token || !method) {
      return NextResponse.json({ error: "Token and method (email or sms) required" }, { status: 400 });
    }

    const userId = verifyTwoFaToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired link. Please sign in again." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const sixDigit = String(randomInt(100000, 1000000)); // CSPRNG — never use Math.random() for OTPs
    const hash = await bcrypt.hash(sixDigit, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCodeHash: hash, otpExpiresAt: expiresAt },
    });

    if (method === "email") {
      await sendEmail({
        to: user.email,
        subject: "Your PrintHub sign-in code",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h1 style="color: #FF4D00;">PrintHub</h1>
            <p>Your sign-in code is: <strong>${sixDigit}</strong></p>
            <p>It expires in 10 minutes. If you didn't request this, ignore this email.</p>
            <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya</p>
          </div>
        `,
      });
    } else {
      const phone = user.phone?.replace(/\D/g, "");
      if (phone) {
        await sendSms({
          to: phone.startsWith("+") ? phone : `+${phone}`,
          body: `Your PrintHub sign-in code is ${sixDigit}. Expires in 10 minutes.`,
        });
      }
    }

    return NextResponse.json({ ok: true, message: method === "email" ? "Code sent to your email." : "Code sent to your phone." });
  } catch (e) {
    console.error("send-2fa-code error:", e);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
