/**
 * POST /api/auth/validate-login — Validate email+password; if 2FA required return a short-lived token for /login/verify.
 * Body: { email, password }. Returns { requires2FA: true, token } or { requires2FA: false }.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signTwoFaToken } from "@/lib/twofa-token";
import { isPrivilegedStaffRole, isStaffWorkEmail } from "@/lib/staff-email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const email = rawEmail.toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        passwordHash: true,
        status: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        totpSecret: true,
        twoFaMethod: true,
      },
    });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (user.status === "DEACTIVATED" || user.status === "INVITE_PENDING") {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: "Account locked. Try again later." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil },
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (isPrivilegedStaffRole(user.role) && !isStaffWorkEmail(email)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Only require 2FA when the user has actually set it up on their account (authenticator, email, or SMS).
    const has2FA = !!(
      user.totpSecret ||
      user.twoFaMethod === "email" ||
      user.twoFaMethod === "sms"
    );

    if (!has2FA) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      return NextResponse.json({ requires2FA: false });
    }

    const token = signTwoFaToken(user.id);
    return NextResponse.json({ requires2FA: true, token });
  } catch (e) {
    console.error("validate-login error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
