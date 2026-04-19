import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Handle incoming SMS "STOP" replies from Africa's Talking.
 */
export async function POST(req: NextRequest) {
  try {
    const rawData = await req.formData();
    const phone = rawData.get("from")?.toString();
    const text = rawData.get("text")?.toString()?.toLowerCase() || "";

    if (!phone) {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 });
    }

    if (text === "stop") {
      await prisma.user.updateMany({
        where: { phone },
        data: {
          smsMarketingOptIn: false,
          smsUnsubscribedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Unsubscribed" });
    }

    return NextResponse.json({ success: true, message: "No action taken" });
  } catch (err) {
    console.error("[sms-unsubscribe]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
