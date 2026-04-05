import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/content/broadcasts
 * Secure endpoint for n8n to push AI-generated marketing broadcasts.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-printhub-signature");
  const secret = process.env.N8N_WEBHOOK_SECRET || "";
  
  if (!signature || signature !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, title, bodyText, metadata } = body;

    if (!type || !title || !bodyText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const broadcast = await prisma.marketingBroadcast.create({
      data: {
        type,
        title,
        bodyText,
        status: "PENDING",
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      broadcastId: broadcast.id,
    });
  } catch (error) {
    console.error("[Broadcasts API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
