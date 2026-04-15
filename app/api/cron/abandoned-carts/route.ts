/**
 * GET /api/cron/abandoned-carts
 * Secured by CRON_SECRET (header: Authorization: Bearer <CRON_SECRET> or x-cron-secret).
 * Finds carts with email, no conversion; sends 1h reminder if not sent, 24h reminder if 1h sent and 24h passed.
 */

import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartEmail1, sendAbandonedCartEmail2 } from "@/lib/email";
import { checkCronAuth } from "@/lib/cron-auth";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
const cartUrl = `${baseUrl}/cart`;

function unsubscribeToken(email: string): string {
  // SEC-004: Never use an empty HMAC key — if CRON_SECRET is unset, tokens are
  // trivially forgeable (HMAC with "" is deterministic and publicly known).
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET env var is required for unsubscribe tokens");
  return createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
}

export async function GET(req: Request) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const cartsWithEmail = await prisma.cart.findMany({
    where: {
      email: { not: null },
      convertedAt: null,
      recoveryOptOutAt: null,
    },
    select: {
      id: true,
      email: true,
      items: true,
      lastActivityAt: true,
      recoveryEmailSent1At: true,
      recoveryEmailSent2At: true,
    },
  });

  let sent1 = 0;
  let sent2 = 0;

  for (const cart of cartsWithEmail) {
    const email = cart.email!;
    // BUG-001: Operator precedence fix. Without parentheses this was parsed as
    // (cart.lastActivityAt ?? cart.email) ? now : null — which is always `now`
    // because cart.email is always a truthy string (filtered by the query above),
    // making lastActivity always equal to `now` and the timing checks always fail.
    const lastActivity = cart.lastActivityAt ?? (cart.email ? now : null);
    if (!lastActivity) continue;

    // First email: last activity >= 1h ago and first email not sent
    if (!cart.recoveryEmailSent1At && lastActivity <= oneHourAgo) {
      try {
        await sendAbandonedCartEmail1(email, "", cartUrl);
        await prisma.cart.update({
          where: { id: cart.id },
          data: { recoveryEmailSent1At: now },
        });
        sent1++;
      } catch (e) {
        console.error("Abandoned cart email 1 failed:", cart.id, e);
      }
      continue;
    }

    // Second email: first already sent, last activity >= 24h ago, second not sent
    if (cart.recoveryEmailSent1At && !cart.recoveryEmailSent2At && lastActivity <= twentyFourHoursAgo) {
      try {
        const token = unsubscribeToken(email);
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe/abandoned-cart?email=${encodeURIComponent(email)}&token=${token}`;
        await sendAbandonedCartEmail2(email, "", cartUrl, unsubscribeUrl);
        await prisma.cart.update({
          where: { id: cart.id },
          data: { recoveryEmailSent2At: now },
        });
        sent2++;
      } catch (e) {
        console.error("Abandoned cart email 2 failed:", cart.id, e);
      }
    }
  }

  return NextResponse.json({ ok: true, sent1, sent2 });
}
