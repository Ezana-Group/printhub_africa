/**
 * DELETE /api/n8n/cleanup-sessions
 *
 * Called by n8n workflow "Cron - Admin Session Cleanup (Hourly)".
 * Deletes all NextAuth sessions that have passed their expiry date.
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function DELETE(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const result = await prisma.session.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
    cleanedAt: new Date().toISOString(),
  });
}
