import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const settings = await prisma.businessSettings.findFirst({
      select: {
        aiAutoMockups: true,
        aiAutoVideos: true,
        aiCustomerReplyModel: true,
        aiDescriptionModel: true,
        aiElevenLabsCharLimit: true,
        aiElevenLabsCharUsed: true,
        aiImageGenerator: true,
        aiJijiEnabled: true,
        aiMonthlyBusinessReport: true,
        aiRequireApproval: true,
        aiTelegramBot: true,
        aiVoiceTranscription: true,
        aiWeeklyTrendReport: true,
        aiSocialGenerationEnabled: true,
        aiAdCopyEnabled: true,
        aiQuoteDraftingEnabled: true,
        aiSentimentAnalysisEnabled: true,
      }
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("[ai-settings-get]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    
    // Get the first business settings record (assuming only one exists)
    const settings = await prisma.businessSettings.findFirst();
    if (!settings) return NextResponse.json({ error: "Settings not found" }, { status: 404 });

    const updated = await prisma.businessSettings.update({
      where: { id: settings.id },
      data: {
        aiAutoMockups: data.aiAutoMockups,
        aiAutoVideos: data.aiAutoVideos,
        aiCustomerReplyModel: data.aiCustomerReplyModel,
        aiDescriptionModel: data.aiDescriptionModel,
        aiImageGenerator: data.aiImageGenerator,
        aiJijiEnabled: data.aiJijiEnabled,
        aiMonthlyBusinessReport: data.aiMonthlyBusinessReport,
        aiRequireApproval: data.aiRequireApproval,
        aiTelegramBot: data.aiTelegramBot,
        aiVoiceTranscription: data.aiVoiceTranscription,
        aiWeeklyTrendReport: data.aiWeeklyTrendReport,
        aiSocialGenerationEnabled: data.aiSocialGenerationEnabled,
        aiAdCopyEnabled: data.aiAdCopyEnabled,
        aiQuoteDraftingEnabled: data.aiQuoteDraftingEnabled,
        aiSentimentAnalysisEnabled: data.aiSentimentAnalysisEnabled,
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[ai-settings-patch]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
