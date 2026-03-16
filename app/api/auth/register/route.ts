import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateToken, getVerifyEmailExpiry } from "@/lib/tokens";
import { rateLimit, getRateLimitClientIp } from "@/lib/rate-limit";

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^a-zA-Z0-9]/, "Password must include a special character (e.g. !@#$%)");

const schema = z
  .object({
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    acceptTerms: z.literal(true).optional(), // optional for backwards compatibility; frontend enforces
    marketingConsent: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 1000;

export async function POST(req: Request) {
  const ip = getRateLimitClientIp(req) ?? "unknown";
  if (!(await rateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS)).ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password, firstName, lastName, marketingConsent = false } = parsed.data;
    // confirmPassword validated by refine; not used further
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        name: fullName || null,
        passwordHash,
        acceptedTermsAt: now,
        termsVersion: "1.0",
        marketingConsent,
        marketingConsentAt: marketingConsent ? now : null,
      },
    });

    const token = generateToken();
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: { identifier: email, token },
      },
      update: { token, expires: getVerifyEmailExpiry() },
      create: {
        identifier: email,
        token,
        expires: getVerifyEmailExpiry(),
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({
      message: "Account created. Please check your email to verify your account.",
      userId: user.id,
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
