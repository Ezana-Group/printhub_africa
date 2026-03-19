import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { EMAIL_TEMPLATE_META, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/** GET – single template by slug. */
export async function GET(
  _req: NextRequest,
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

  const row = await prisma.emailTemplate.findUnique({ where: { slug } });
  const meta = EMAIL_TEMPLATE_META[slug];
  const template = {
    slug,
    name: meta?.name ?? row?.name ?? slug,
    description: meta?.description ?? row?.description ?? undefined,
    subject: row?.subject ?? "",
    bodyHtml: row?.bodyHtml ?? "",
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    updatedBy: row?.updatedBy ?? null,
  };

  return NextResponse.json(template);
}

/** PATCH – update subject and/or bodyHtml. */
export async function PATCH(
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

  const body = await req.json();
  const subject = typeof body.subject === "string" ? body.subject : undefined;
  const bodyHtml = typeof body.bodyHtml === "string" ? body.bodyHtml : undefined;

  if (subject === undefined && bodyHtml === undefined) {
    return NextResponse.json(
      { error: "subject or bodyHtml required" },
      { status: 400 }
    );
  }

  const meta = EMAIL_TEMPLATE_META[slug];
  const updated = await prisma.emailTemplate.upsert({
    where: { slug },
    update: {
      ...(subject !== undefined && { subject }),
      ...(bodyHtml !== undefined && { bodyHtml }),
      updatedBy: (auth.session.user as { id?: string })?.id ?? undefined,
    },
    create: {
      slug,
      name: meta?.name ?? slug,
      description: meta?.description ?? undefined,
      subject: subject ?? "",
      bodyHtml: bodyHtml ?? "",
      updatedBy: (auth.session.user as { id?: string })?.id ?? undefined,
    },
  });

  return NextResponse.json({
    slug: updated.slug,
    name: updated.name,
    description: updated.description ?? undefined,
    subject: updated.subject,
    bodyHtml: updated.bodyHtml,
    updatedAt: updated.updatedAt.toISOString(),
    updatedBy: updated.updatedBy ?? null,
  });
}
