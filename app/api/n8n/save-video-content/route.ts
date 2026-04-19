import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const {
      productId, platform, videoUrl, audioUrl, thumbnailUrl, duration,
    }: { productId: string; platform: string; videoUrl: string; audioUrl?: string; thumbnailUrl?: string; duration?: number } =
      JSON.parse(body);

    if (!productId || !platform || !videoUrl) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const video = await prisma.productVideo.create({
      data: { productId, platform, videoUrl, audioUrl, thumbnailUrl, duration },
    });

    await prisma.$transaction([
      prisma.aiServiceLog.create({
        data: { service: "runway", operation: "video-generate", durationSecs: duration, entityId: productId, entityType: "product", success: true },
      }),
      ...(audioUrl
        ? [prisma.aiServiceLog.create({
            data: { service: "elevenlabs", operation: "voiceover-generate", entityId: productId, entityType: "product", success: true },
          })]
        : []),
    ]);

    return NextResponse.json({ success: true, videoId: video.id });
  } catch (err) {
    console.error("[save-video-content]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
