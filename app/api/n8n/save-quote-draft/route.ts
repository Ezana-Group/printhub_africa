import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const { quoteId, draft, amount, breakdown } = await req.json();

    if (!quoteId || !draft) {
      return NextResponse.json({ error: "Missing quoteId or draft" }, { status: 400 });
    }

    await (prisma.quote as any).update({
      where: { id: quoteId },
      data: {
        aiDraft: draft,
        aiDraftGeneratedAt: new Date(),
        // amount and breakdown are optional fields to pre-fill the form later
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-quote-draft]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
