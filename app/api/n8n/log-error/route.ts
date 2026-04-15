/**
 * POST /api/n8n/log-error
 *
 * Called by n8n workflows when a workflow node throws an error.
 * Persists the error to AuditLog so it surfaces in the admin panel.
 *
 * Body:
 *   { workflowName, errorMessage, node, executionId, metadata? }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface LogErrorBody {
  workflowName?: string;
  errorMessage?: string;
  node?: string;
  executionId?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: LogErrorBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workflowName, errorMessage, node, executionId, metadata } = body;

  await prisma.auditLog.create({
    data: {
      action: "N8N_WORKFLOW_ERROR",
      entity: "n8n_workflow",
      entityId: executionId ?? null,
      after: {
        workflowName: workflowName ?? "unknown",
        errorMessage: errorMessage ?? "unknown",
        node: node ?? "unknown",
        executionId: executionId ?? null,
        ...(metadata ?? {}),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
