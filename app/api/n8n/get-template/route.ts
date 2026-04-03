import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/n8n/get-template?slug=...&type=EMAIL|WHATSAPP
 * Fetches a dynamic template from the database for n8n automation.
 */
export async function POST(req: NextRequest) {
  // Use POST to ensure we can verify the signature with a body if needed, 
  // although n8n standard for context fetching is often GET.
  // Given verifyN8nWebhook reads body, we'll use POST for consistency.
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const { slug, type } = await req.json();

    if (!slug || !type) {
      return NextResponse.json({ error: "Missing slug or type" }, { status: 400 });
    }

    if (type === "EMAIL") {
      const template = await prisma.emailTemplate.findUnique({
        where: { slug },
      });

      if (!template) {
        return NextResponse.json({ error: `Email template '${slug}' not found` }, { status: 404 });
      }

      return NextResponse.json({
        id: template.id,
        slug: template.slug,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        name: template.name,
      });
    }

    if (type === "WHATSAPP") {
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { slug },
      });

      if (!template) {
        return NextResponse.json({ error: `WhatsApp template '${slug}' not found` }, { status: 404 });
      }

      return NextResponse.json({
        id: template.id,
        slug: template.slug,
        bodyText: template.bodyText,
        name: template.name,
        category: template.category,
      });
    }

    return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
  } catch (err) {
    console.error("[get-template]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
