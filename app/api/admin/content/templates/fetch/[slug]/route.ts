import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * GET /api/admin/content/templates/fetch/[slug]
 * Secure endpoint to fetch a template by slug.
 * Requires x-printhub-signature for internal security.
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const signature = request.headers.get("x-printhub-signature");
  
  // Verification logic using INTERNAL_WEBHOOK_SECRET
  const secret = process.env.INTERNAL_WEBHOOK_SECRET ?? process.env.N8N_WEBHOOK_SECRET || "";
  if (!signature || signature !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check WhatsApp templates first
    let template: any = await prisma.whatsAppTemplate.findUnique({
      where: { slug },
    });

    // If not found, check Email templates
    if (!template) {
      template = await prisma.emailTemplate.findUnique({
        where: { slug },
      });
    }

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      slug: template.slug,
      name: template.name,
      body: template.bodyText || template.bodyHtml,
      status: template.status,
    });
  } catch (error) {
    console.error("[Template Fetch API] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
