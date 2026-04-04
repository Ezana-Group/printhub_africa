import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const sessionId = params.id;

    const existingSession = await prisma.adminSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updatedSession = await prisma.adminSession.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
      },
    });

    // Log the revocation
    await prisma.auditLog.create({
      data: {
        action: "ADMIN_SESSION_REVOKED",
        category: "SECURITY",
        entity: "AdminSession",
        entityId: sessionId,
        details: { sessionId, revokedBy: session.user.id },
        userId: existingSession.userId,
      },
    });

    return NextResponse.json({ success: true, message: "Admin session revoked" });
  } catch (err) {
    console.error(`[api/admin/sessions/revoke] Error:`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
