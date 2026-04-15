/**
 * POST /api/n8n/log-ai-usage
 *
 * Called after every AI API call in n8n workflows to track costs and usage.
 *
 * Body:
 *   {
 *     service: string,       // "Anthropic" | "OpenAI" | "Stability" | "ElevenLabs"
 *     operation: string,     // e.g. "customer-reply"
 *     model?: string,        // e.g. "claude-opus-4-6"
 *     inputTokens?: number,
 *     outputTokens?: number,
 *     costUsd?: number,
 *     success?: boolean,
 *     metadata?: object
 *   }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface LogAIUsageBody {
  service: string;
  operation: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: LogAIUsageBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { service, operation, model, inputTokens, outputTokens, costUsd, success, metadata } =
    body;

  if (!service || !operation) {
    return NextResponse.json(
      { error: "service and operation are required" },
      { status: 400 }
    );
  }

  const record = await prisma.aiUsageLog.create({
    data: {
      service,
      operation,
      model: model ?? null,
      inputTokens: inputTokens ?? null,
      outputTokens: outputTokens ?? null,
      costUsd: costUsd ?? null,
      success: success !== false,
      metadata: metadata ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, id: record.id });
}
