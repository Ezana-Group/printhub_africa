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
  if (!(await rateLimit(`admin-forgot-password:${ip}`, FORGOT_PASSWORD_LIMIT, FORGOT_PASSWORD_WINDOW_MS)).ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;

    // IMPORTANT: Only allow staff/admins to use this endpoint (security)
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, passwordHash: true }
    });

    // We return a generic message even if user doesn't exist for security
    const genericResponse = {
      message: "If an administrative account exists with this email, you will receive a reset link.",
    };

    if (!user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(user.role)) {
      return NextResponse.json(genericResponse);
    }

    if (!user.passwordHash) {
      return NextResponse.json(genericResponse);
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

    // Determine the base URL for the reset link
    const host = req.headers.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    await sendPasswordResetEmail(email, token, baseUrl);

    return NextResponse.json(genericResponse);
  } catch (e) {
    console.error("Admin forgot password error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
