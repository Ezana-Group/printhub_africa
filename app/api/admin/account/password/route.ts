import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Passwords required" }, { status: 400 });
    }

    if (newPassword.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      select: { passwordHash: true, passwordHistory: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
    }

    // Password reuse check (last 3 passwords)
    const history = user.passwordHistory || [];
    for (const oldHash of history) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        return NextResponse.json({ error: "Cannot reuse one of your last 3 passwords" }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const newHistory = [user.passwordHash, ...history].slice(0, 3);

    await prisma.user.update({
      where: { id: auth.session.user.id },
      data: {
        passwordHash: hashed,
        passwordHistory: newHistory,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Password update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
