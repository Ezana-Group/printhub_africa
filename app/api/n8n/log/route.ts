/**
 * POST /api/n8n/log
 *
 * General-purpose audit log endpoint called by n8n workflows to record
 * automated actions (catalog syncs, cron completions, etc.).
 *
 * Body:
 *   { action, details?, metadata? }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface LogBody {
  action?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: LogBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, details, metadata } = body;

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  await prisma.auditLog.create({
    data: {
      action,
      entity: "n8n_automation",
      after: {
        details: details ?? null,
        source: "n8n",
        ...(metadata ?? {}),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
