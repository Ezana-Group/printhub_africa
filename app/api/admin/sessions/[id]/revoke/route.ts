import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
