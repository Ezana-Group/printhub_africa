import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { adminAuthOptions } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { generateSecret, generateURI, verify } from "otplib";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, token } = await req.json().catch(() => ({}));

    if (action === "setup") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { adminTwoFactorEnabled: true, email: true },
      });

      if (user?.adminTwoFactorEnabled) {
        return NextResponse.json(
          { error: "2FA is already enabled" },
          { status: 400 }
        );
      }

      const secret = generateSecret();
      const otpauth = generateURI({
        label: user?.email || "Staff",
        issuer: "PrintHub Admin",
        secret
      });

      // We temporarily store the secret in the user record, or return it to be verified.
      // Easiest is to save it but not mark enabled until verified.
      await prisma.user.update({
        where: { id: session.user.id },
        data: { adminTwoFactorSecret: secret },
      });

      return NextResponse.json({ secret, otpauth });
    }

    if (action === "verify") {
      if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { adminTwoFactorSecret: true },
      });

      if (!user?.adminTwoFactorSecret) {
        return NextResponse.json(
          { error: "Setup not initialized" },
          { status: 400 }
        );
      }

      const isValid = verify({
        token,
        secret: user.adminTwoFactorSecret,
      });

      if (!isValid) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          adminTwoFactorEnabled: true,
          adminTwoFactorVerifiedAt: new Date(),
          adminTwoFactorBackupCodes: backupCodes, // Stored as JSON array
          adminTwoFactorGraceEndsAt: null, // Clear grace period
        },
      });

      return NextResponse.json({ success: true, backupCodes });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[ADMIN_2FA_API]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
