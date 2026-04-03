import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, productId, quoteId } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const n8nBaseUrl = process.env.N8N_WEBHOOK_URL || "https://n8n.printhub.africa";
    const secret = process.env.N8N_WEBHOOK_SECRET;

    if (!secret) {
      return NextResponse.json({ error: "N8N Webhook Secret not configured" }, { status: 500 });
    }

    // Determine the n8n path based on the action
    let n8nPath = "";
    const payload: any = { timestamp: Date.now() };

    switch (action) {
      case "GENERATE_DESCRIPTION":
        n8nPath = "ai-generate-descriptions";
        payload.productId = productId;
        break;
      case "GENERATE_AD_COPY":
        n8nPath = "ai-generate-adcopy";
        payload.productId = productId;
        break;
      case "GENERATE_SOCIAL":
        n8nPath = "ai-generate-social";
        payload.productId = productId;
        break;
      case "GENERATE_QUOTE_DRAFT":
        n8nPath = "ai-generate-quotedraft";
        payload.quoteId = quoteId;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const n8nUrl = `${n8nBaseUrl}/webhook/${n8nPath}`;

    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-printhub-signature": signature,
        "x-printhub-timestamp": payload.timestamp.toString(),
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `n8n error: ${errorText}` }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: "AI generation triggered" });
  } catch (err) {
    console.error("[ai/generate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
