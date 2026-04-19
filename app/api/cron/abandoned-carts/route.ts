/**
 * GET /api/cron/abandoned-carts
 * Secured by CRON_SECRET (header: Authorization: Bearer <CRON_SECRET> or x-cron-secret).
 * Finds carts with email, no conversion; sends 1h reminder if not sent, 24h reminder if 1h sent and 24h passed.
 */

import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartEmail1, sendAbandonedCartEmail2 } from "@/lib/email";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
const cartUrl = `${baseUrl}/cart`;

function unsubscribeToken(email: string): string {
  const secret = process.env.CRON_SECRET ?? "";
  return createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
}

function checkCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get("x-cron-secret");
  return bearer === secret || headerSecret === secret;
}

export async function GET(req: Request) {
  return NextResponse.json({ 
    message: "This cron task has been migrated to n8n automation. n8n pulls from /api/n8n/get-abandoned-carts every hour.",
    migrated: true 
  });
}
