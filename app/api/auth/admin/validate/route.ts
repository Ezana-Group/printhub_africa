import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";

export async function POST(req: Request) {
  try {
    const { email, password, totpCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        status: true,
        totpSecret: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    if (!user || user.status === "DEACTIVATED") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "This is a staff portal. Customer accounts must log in at printhub.africa." }, { status: 403 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: "Account locked. Try again after 15 minutes." }, { status: 423 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash || "");
    if (!isValid) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2FA Check
    if (user.totpSecret && !totpCode) {
      return NextResponse.json({ requires2FA: true }, { status: 200 }); // OK but requires code
    }

    if (user.totpSecret && totpCode) {
      const verified = verifySync({ secret: user.totpSecret, token: totpCode });
      if (!verified) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Admin validation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
