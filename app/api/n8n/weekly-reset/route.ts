/**
 * POST /api/n8n/weekly-reset
 *
 * Called by the Cron AI-5 weekly reset workflow every Sunday at 9:01 PM UTC.
 * Records a weekly reset checkpoint in the audit log and resets any
 * weekly counters (currently: clears processed n8n content older than 90 days).
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Archive old published/rejected AI content (keep pending for review)
  const archived = await prisma.n8nGeneratedContent.deleteMany({
    where: {
      createdAt: { lt: ninetyDaysAgo },
      status: { in: ["PUBLISHED", "REJECTED"] },
    },
  });

  // Log the weekly reset
  await prisma.auditLog.create({
    data: {
      action: "N8N_WEEKLY_RESET",
      entity: "n8n_automation",
      after: {
        archivedContentRecords: archived.count,
        resetAt: new Date().toISOString(),
        source: "n8n Cron AI-5",
      },
    },
  });

  return NextResponse.json({
    ok: true,
    resetAt: new Date().toISOString(),
    archivedContentRecords: archived.count,
  });
}
