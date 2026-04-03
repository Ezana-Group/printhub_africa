import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.json();
    const { smsText, recipientCount, featuredProducts, broadcastDate } = body;

    const broadcast = await prisma.smsBroadcast.create({
      data: {
        smsText,
        recipientCount: Number(recipientCount),
        featuredProducts: featuredProducts || [],
        broadcastDate: broadcastDate ? new Date(broadcastDate) : new Date(),
        sentAt: new Date(),
      },
    });

    return NextResponse.json(broadcast);
  } catch (err) {
    console.error("[save-sms-broadcast]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
