import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const { service }: { service: string } = JSON.parse(body);

    const serviceToFlag: Record<string, string> = {
      telegram: "aiTelegramBot",
      elevenlabs: "aiVoiceTranscription",
      runway: "aiAutoVideos",
      stability: "aiAutoMockups",
      jiji: "aiJijiEnabled",
    };

    const flag = serviceToFlag[service];
    if (!flag) {
      await prisma.aiServiceLog.create({
        data: {
          service,
          operation: "circuit-breaker-trigger",
          success: false,
          error: `Circuit breaker: no toggle mapped for service "${service}"`,
        },
      });
      return NextResponse.json({ success: true, flag: null });
    }

    await prisma.businessSettings.updateMany({ data: { [flag]: false } });

    await prisma.aiServiceLog.create({
      data: {
        service,
        operation: "circuit-breaker-disable",
        success: false,
        error: `Circuit breaker triggered — service disabled automatically`,
      },
    });

    return NextResponse.json({ success: true, flag, disabled: true });
  } catch (err) {
    console.error("[disable-ai-service]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
