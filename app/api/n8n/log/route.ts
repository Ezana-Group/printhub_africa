import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const {
      service,
      operation,
      model,
      inputTokens = 0,
      outputTokens = 0,
      imageCount = 0,
      audioChars = 0,
      durationSecs = 0,
      costUsd = 0,
      success = true,
      error,
      entityId,
      entityType,
    } = body;

    if (!service || !operation) {
      return NextResponse.json({ error: "Missing service or operation" }, { status: 400 });
    }

    const serviceKey = service.toLowerCase();

    const log = await prisma.aiServiceLog.create({
      data: {
        service: serviceKey,
        operation,
        model,
        inputTokens,
        outputTokens,
        imageCount,
        audioChars,
        durationSecs,
        costUsd,
        success,
        error,
        entityId,
        entityType,
      },
    });

    // Special handling for ElevenLabs character counting
    if (serviceKey === "elevenlabs" && audioChars > 0) {
      await prisma.businessSettings.updateMany({
        data: {
          aiElevenLabsCharUsed: {
            increment: audioChars,
          },
        },
      });
    }

    return NextResponse.json({ success: true, logId: log.id });
  } catch (err) {
    console.error("[log-ai-usage]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
