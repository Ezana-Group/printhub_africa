import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateToken, getVerifyEmailExpiry } from "@/lib/tokens";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";

const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: Request) {
  const ip = getRateLimitClientIp(req) ?? "unknown";
  if (!(await rateLimit(`resend-verification:${ip}`, RESEND_LIMIT, RESEND_WINDOW_MS)).ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const email = rawEmail.toLowerCase();
    if (!email || !rawEmail.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: rawEmail.trim(), mode: "insensitive" } },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. You can sign in." },
        { status: 400 }
      );
    }

    const token = generateToken();
    const expires = getVerifyEmailExpiry();
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });
    await prisma.verificationToken.create({
      data: { identifier: user.email, token, expires },
    });

    await sendVerificationEmail(user.email, token);

    return NextResponse.json({
      message: "Verification email sent. Check your inbox and click the link.",
    });
  } catch (e) {
    console.error("Resend verification error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
