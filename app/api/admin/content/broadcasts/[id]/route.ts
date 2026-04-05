import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";

/**
 * PATCH /api/admin/content/broadcasts/[id]
 * Endpoint to approve or reject a marketing broadcast.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { status } = await request.json();

  if (!["APPROVED", "REJECTED", "SENT"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // MED-3: Rate Limit for triggering broadcasts (SENT or APPROVED)
  if (status === "SENT" || status === "APPROVED") {
    const { rateLimit } = await import("@/lib/rate-limit");
    const adminId = session.user.id;
    const rl = await rateLimit(`broadcast-trigger:${adminId}`, { limit: 1, windowMs: 3600000 }); // 1 per hour
    if (!rl.success) {
      return NextResponse.json({ 
        error: "Rate limit exceeded. Max 1 broadcast per hour per admin.",
        resetAt: rl.resetAt 
      }, { status: 429 });
    }
  }

  try {
    const oldBroadcast = await prisma.marketingBroadcast.findUnique({ where: { id } });
    const broadcast = await prisma.marketingBroadcast.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date(),
      },
    });

    // MED-3: Log broadcast action to AuditLog
    const { createAuditLog } = await import("@/lib/audit");
    await createAuditLog({
      userId: session.user.id,
      action: `BROADCAST_${status}`,
      entity: "MARKETING_BROADCAST",
      entityId: id,
      before: { status: oldBroadcast?.status },
      after: { status: broadcast.status },
    });
    
    return NextResponse.json({ success: true, broadcast });
  } catch (error) {
    console.error("[Broadcasts Patch API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
