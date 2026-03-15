/**
 * GET /api/unsubscribe/abandoned-cart?email=...&token=...
 * Token = HMAC-SHA256(CRON_SECRET, email) in hex. Verifies and sets recoveryOptOutAt on all carts with this email.
 * Redirects to /unsubscribe/abandoned-cart/done on success.
 */

import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

function tokenFor(email: string): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET must be set for unsubscribe links");
  }
  return createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
}

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  const doneUrl = `${baseUrl}/unsubscribe/abandoned-cart/done`;

  if (!process.env.CRON_SECRET) {
    return NextResponse.redirect(`${doneUrl}?error=server`);
  }
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")?.trim();
  const token = searchParams.get("token");
  if (!email || !token) {
    return NextResponse.redirect(`${doneUrl}?error=missing`);
  }
  const expected = tokenFor(email);
  if (token !== expected) {
    return NextResponse.redirect(`${doneUrl}?error=invalid`);
  }

  try {
    await prisma.cart.updateMany({
      where: { email: email.toLowerCase() },
      data: { recoveryOptOutAt: new Date() },
    });
  } catch {
    return NextResponse.redirect(`${doneUrl}?error=server`);
  }
  return NextResponse.redirect(doneUrl);
}
