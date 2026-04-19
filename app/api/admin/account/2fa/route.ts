import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { generateSecret, generateURI, verifySync } from "otplib";

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      select: { totpSecret: true, email: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.totpSecret) {
      return NextResponse.json({ enabled: true });
    }

    // Generate new secret for setup
    const secret = generateSecret();
    const otpauth = generateURI({
      secret: secret,
      label: user.email,
      issuer: "PrintHub Admin",
    });

    return NextResponse.json({ enabled: false, secret, otpauth });
  } catch (err) {
    console.error("2FA GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { secret, token, action } = await req.json();

    if (action === "disable") {
      await prisma.user.update({
        where: { id: auth.session.user.id },
        data: { totpSecret: null },
      });
      return NextResponse.json({ success: true });
    }

    if (!secret || !token) {
      return NextResponse.json({ error: "Secret and token required" }, { status: 400 });
    }

    const isValid = verifySync({ token, secret });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.session.user.id },
      data: { totpSecret: secret },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("2FA POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
