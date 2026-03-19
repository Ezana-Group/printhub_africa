import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { EMAIL_TEMPLATE_META, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/** GET – list all email templates (DB rows merged with meta; missing slugs show as editable after seed). */
export async function GET() {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const rows = await prisma.emailTemplate.findMany({
    orderBy: { slug: "asc" },
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const list = EMAIL_TEMPLATE_SLUGS.map((slug) => {
    const meta = EMAIL_TEMPLATE_META[slug];
    const row = bySlug.get(slug);
    return {
      slug,
      name: meta?.name ?? row?.name ?? slug,
      description: meta?.description ?? row?.description ?? undefined,
      subject: row?.subject ?? "",
      bodyHtml: row?.bodyHtml ?? "",
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  });

  return NextResponse.json({ templates: list });
}
