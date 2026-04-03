import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

/**
 * Handle admin approval for SMS broadcasts.
 * Note: This can be a GET for easy link clicking from email.
 */
export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const broadcastId = searchParams.get("broadcastId");

  if (!broadcastId) {
    return NextResponse.json({ error: "Missing broadcastId" }, { status: 400 });
  }

  try {
    const broadcast = await prisma.smsBroadcast.update({
      where: { id: broadcastId },
      data: {
        approvedBy: "Admin (API Approved)",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, broadcast });
  } catch (err) {
    console.error("[approve-sms-broadcast]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
