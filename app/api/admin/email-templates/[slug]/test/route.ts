import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { getEmailTemplate, renderTemplate, getSampleContextForSlug, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/** POST – send a test email for this template. Body: { to?: string }. */
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
  const to = typeof body.to === "string" && body.to.trim() ? body.to.trim() : (auth.session.user?.email as string | undefined);
  if (!to) {
    return NextResponse.json(
      { error: "No recipient: provide 'to' in body or ensure your account has an email" },
      { status: 400 }
    );
  }

  const t = await getEmailTemplate(slug);
  if (!t) {
    return NextResponse.json(
      { error: "Template not found or empty; seed email templates first" },
      { status: 404 }
    );
  }

  const context = getSampleContextForSlug(slug);
  const subject = renderTemplate(t.subject, context);
  const html = renderTemplate(t.bodyHtml, context);

  try {
    await sendEmail({ to, subject, html });
    return NextResponse.json({ ok: true, to });
  } catch (e) {
    console.error("Test email send failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send test email" },
      { status: 500 }
    );
  }
}
