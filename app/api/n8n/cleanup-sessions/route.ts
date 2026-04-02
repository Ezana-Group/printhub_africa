import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nWebhook } from "@/lib/n8n-verify";

/**
 * Endpoint for n8n cron to cleanup expired AdminSessions.
 */
export async function POST(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await prisma.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    await prisma.auditLog.create({
      data: {
        category: "SECURITY",
        action: "SESSION_CLEANUP",
        details: { deletedCount: result.count },
      },
    });

    return NextResponse.json({ deletedCount: result.count });
  } catch (err) {
    console.error("[cleanup-sessions] Error cleaning up sessions:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
