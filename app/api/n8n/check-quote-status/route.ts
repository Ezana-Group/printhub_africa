import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nWebhook } from "@/lib/n8n-verify";

/**
 * Used by n8n to check the status of a quote after sending reminders.
 */
export async function GET(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quoteId } = Object.fromEntries(req.nextUrl.searchParams.entries());

    if (!quoteId) return NextResponse.json({ error: "quoteId required" }, { status: 400 });

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true },
    });

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    // Mapping prisma enum to human-readable strings if needed
    return NextResponse.json({ status: quote.status.toLowerCase() });
  } catch (err) {
    console.error("[check-quote-status] Error checking quote:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
