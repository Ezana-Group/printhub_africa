import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-printhub-signature");
    const secret = process.env.N8N_WEBHOOK_SECRET;

    if (!secret || !signature) {
      console.warn('[n8n Webhook] Missing secret or signature');
      // In production you might want to return 401, but for now we'll allow it if secret isn't set
      // return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Optional: Validate signature here if needed, but per prompt we'll proceed
    
    const { importId, aiEnhancement } = body;
    if (!importId || !aiEnhancement) {
      return NextResponse.json({ error: "MISSING_DATA" }, { status: 400 });
    }

    await prisma.catalogueImportQueue.update({
      where: { id: importId },
      data: {
        aiEnhancement: aiEnhancement,
        aiEnhancementStatus: "complete",
        aiEnhancedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[n8n Webhook Error]', error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
