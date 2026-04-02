import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const allowedKeys = [
      "aiRequireApproval", "aiAutoMockups", "aiAutoVideos", "aiVoiceTranscription",
      "aiTelegramBot", "aiWeeklyTrendReport", "aiMonthlyBusinessReport", "aiJijiEnabled",
      "aiCustomerReplyModel", "aiDescriptionModel", "aiImageGenerator",
      "aiElevenLabsCharLimit",
    ];
    const data: Record<string, boolean | string | number> = {};
    for (const key of allowedKeys) {
      if (key in body) data[key] = body[key];
    }

    await prisma.businessSettings.updateMany({ data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[settings/ai]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
