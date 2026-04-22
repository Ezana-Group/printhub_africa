import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendServerEvent } from "@/lib/marketing/server-events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventData } = body as {
      eventName?: string;
      eventId?: string;
      eventData?: Record<string, any>;
    };

    if (!eventName) {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    const id = eventId || crypto.randomUUID();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const eventSourceUrl = eventData?.eventSourceUrl || req.headers.get("referer") || undefined;

    const result = await sendServerEvent(eventName, {
      ...eventData,
      eventId: id,
      userIp: ip,
      userAgent,
      eventSourceUrl,
    });

    return NextResponse.json({ success: result.success, eventId: result.eventId, results: result.results });
  } catch (error) {
    console.error("[MARKETING_TRACK_API_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
