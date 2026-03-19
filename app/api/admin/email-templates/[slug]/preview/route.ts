import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { getEmailTemplate, renderTemplate, getSampleContextForSlug, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/** GET – preview template with sample context. Query: ?subject=...&bodyHtml=... to preview unsaved edits (short content only). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { slug } = await params;
  if (!EMAIL_TEMPLATE_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Unknown template slug" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const subjectOverride = searchParams.get("subject");
  const bodyOverride = searchParams.get("bodyHtml");

  const context = getSampleContextForSlug(slug);
  let subject: string;
  let html: string;

  if (subjectOverride !== null && bodyOverride !== null) {
    subject = renderTemplate(decodeURIComponent(subjectOverride), context);
    html = renderTemplate(decodeURIComponent(bodyOverride), context);
  } else {
    const t = await getEmailTemplate(slug);
    if (!t) {
      return NextResponse.json(
        { error: "Template not found or empty" },
        { status: 404 }
      );
    }
    subject = renderTemplate(t.subject, context);
    html = renderTemplate(t.bodyHtml, context);
  }

  return NextResponse.json({ subject, html });
}

/** POST – preview with unsaved subject/body (no URL length limit). Body: { subject?: string, bodyHtml?: string }. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { slug } = await params;
  if (!EMAIL_TEMPLATE_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Unknown template slug" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const subjectIn = typeof body.subject === "string" ? body.subject : null;
  const bodyHtmlIn = typeof body.bodyHtml === "string" ? body.bodyHtml : null;

  const context = getSampleContextForSlug(slug);
  let subject: string;
  let html: string;

  if (subjectIn !== null && bodyHtmlIn !== null) {
    subject = renderTemplate(subjectIn, context);
    html = renderTemplate(bodyHtmlIn, context);
  } else {
    const t = await getEmailTemplate(slug);
    if (!t) {
      return NextResponse.json({ error: "Template not found or empty" }, { status: 404 });
    }
    subject = renderTemplate(t.subject, context);
    html = renderTemplate(t.bodyHtml, context);
  }

  return NextResponse.json({ subject, html });
}
