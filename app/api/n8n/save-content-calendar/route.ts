/**
 * POST /api/n8n/save-content-calendar
 *
 * Saves an AI-generated content calendar to the N8nGeneratedContent table
 * for editorial review and scheduling.
 *
 * Body:
 *   { calendar: object | string, title?: string, source?: string, metadata?: object }
 *
 * Auth: x-printhub-signature header matching N8N_WEBHOOK_SECRET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateN8nSecret, n8nUnauthorized } from "@/lib/n8n-auth";

interface SaveContentCalendarBody {
  calendar: unknown;
  title?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: Request) {
  if (!validateN8nSecret(req)) return n8nUnauthorized();

  let body: SaveContentCalendarBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { calendar, title, source, metadata } = body;

  if (!calendar) {
    return NextResponse.json({ error: "calendar is required" }, { status: 400 });
  }

  let parsedCalendar: unknown = calendar;
  if (typeof calendar === "string") {
    try {
      parsedCalendar = JSON.parse(calendar);
    } catch {
      parsedCalendar = { raw: calendar };
    }
  }

  const record = await prisma.n8nGeneratedContent.create({
    data: {
      type: "CONTENT_CALENDAR",
      title: title ?? `Content Calendar — ${new Date().toLocaleDateString("en-GB")}`,
      body: parsedCalendar as object,
      status: "PENDING_APPROVAL",
      source: source ?? "n8n-content-calendar",
      metadata: metadata ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, id: record.id });
}
