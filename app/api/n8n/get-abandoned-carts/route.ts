/**
 * GET /api/n8n/get-abandoned-carts
 *
 * Called by n8n workflow "1. Cron - Abandoned Cart Detector (30m)".
 * Returns carts that qualify as abandoned:
 *   - Have an email address (required for recovery)
 *   - Have not been converted yet
 *   - Have not been opted out of recovery
 *   - Last activity was > 30 minutes ago
 *   - Have not yet received both recovery emails (or a staged send is due)
 *
 * Auth: x-n8n-secret header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

export async function GET(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const carts = await prisma.cart.findMany({
    where: {
      email: { not: null },
      convertedAt: null,
      recoveryOptOutAt: null,
      lastActivityAt: { lt: thirtyMinutesAgo },
      OR: [
        // Never received first email
        { recoveryEmailSent1At: null },
        // Received first but not second, and it's been 24h since first
        {
          recoveryEmailSent1At: { lt: twentyFourHoursAgo },
          recoveryEmailSent2At: null,
        },
      ],
    },
    select: {
      id: true,
      email: true,
      phone: true,
      items: true,
      lastActivityAt: true,
      recoveryEmailSent1At: true,
      recoveryEmailSent2At: true,
      createdAt: true,
    },
    orderBy: { lastActivityAt: "asc" },
    take: 100,
  });

  // Enrich with stage info so the n8n workflow knows which email to send
  const enriched = carts.map((cart) => ({
    ...cart,
    stage: cart.recoveryEmailSent1At === null ? 1 : 2,
    cartUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/cart/recover?id=${cart.id}`,
  }));

  return NextResponse.json({ carts: enriched, total: enriched.length });
}
