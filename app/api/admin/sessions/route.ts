import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const sessions = await prisma.adminSession.findMany({
      where: {
        userId: auth.session.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("Fetch sessions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    await prisma.adminSession.update({
      where: { id: sessionId, userId: auth.session.user.id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Revoke session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
