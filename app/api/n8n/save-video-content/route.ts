/**
 * POST /api/n8n/save-video-content
 *
 * Saves metadata for AI-generated video content (ElevenLabs + Runway ML)
 * to the N8nGeneratedContent table for review.
 *
 * Body:
 *   {
 *     productId?: string,
 *     videoUrl?: string,
 *     audioUrl?: string,
 *     script?: string,
 *     title?: string,
 *     source?: string,
 *     metadata?: object
 *   }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface SaveVideoContentBody {
  productId?: string;
  videoUrl?: string;
  audioUrl?: string;
  script?: string;
  title?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: SaveVideoContentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId, videoUrl, audioUrl, script, title, source, metadata } = body;

  const record = await prisma.n8nGeneratedContent.create({
    data: {
      type: "VIDEO",
      productId: productId ?? null,
      title: title ?? null,
      body: {
        videoUrl: videoUrl ?? null,
        audioUrl: audioUrl ?? null,
        script: script ?? null,
        ...(metadata ?? {}),
      },
      status: "PENDING_APPROVAL",
      source: source ?? "n8n-video-ai",
    },
  });

  return NextResponse.json({ ok: true, id: record.id });
}
