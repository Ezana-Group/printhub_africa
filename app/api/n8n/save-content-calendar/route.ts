import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const { weekStarting, strategy, contentCalendar } = JSON.parse(body);

    if (!weekStarting || !strategy || !contentCalendar) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const record = await prisma.contentCalendar.create({
      data: {
        weekStarting: new Date(weekStarting),
        strategy,
        contentCalendar,
        generatedBy: "ai",
      },
    });

    await prisma.$transaction([
      prisma.aiServiceLog.create({ data: { service: "perplexity", operation: "trend-research", success: true } }),
      prisma.aiServiceLog.create({ data: { service: "gemini", operation: "strategy-synthesis", success: true } }),
      prisma.aiServiceLog.create({ data: { service: "claude", operation: "content-calendar-write", success: true } }),
    ]);

    return NextResponse.json({ success: true, id: record.id });
  } catch (err) {
    console.error("[save-content-calendar]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
