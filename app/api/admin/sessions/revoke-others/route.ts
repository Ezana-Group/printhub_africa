import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentUserId = session.user.id;
    // Current session token can be retrieved if we track it, but often we just revoke all others
    const authSessionToken = (req.headers.get("authorization") || "").replace("Bearer ", "");

    // Note: If we don't have the token readily available, we can't easily exclude "only current" 
    // unless we identify it. In Next.js Auth, it's usually in a cookie.
    
    // For this implementation, we'll revoke all OTHER sessions for the user
    // We assume the caller sends the current session ID or we find it.
    const { currentSessionId } = await req.json();

    const result = await prisma.adminSession.updateMany({
      where: {
        userId: currentUserId,
        id: { not: currentSessionId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Log the revocation
    await prisma.auditLog.create({
      data: {
        action: "ADMIN_OTHERS_SESSIONS_REVOKED",
        category: "SECURITY",
        details: { revokedCount: result.count, currentSessionId },
        userId: currentUserId,
      },
    });

    return NextResponse.json({ success: true, message: `Revoked ${result.count} other session(s).` });
  } catch (err) {
    console.error(`[api/admin/sessions/revoke-others] Error:`, err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
