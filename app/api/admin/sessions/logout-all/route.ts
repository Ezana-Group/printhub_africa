import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "settings" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { currentSessionId } = await req.json();

    // Revoke all other admin sessions for this user
    await prisma.adminSession.updateMany({
      where: {
        userId: auth.session.user.id,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout all sessions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
