import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { WHATSAPP_TEMPLATE_META, WHATSAPP_TEMPLATE_SLUGS } from "@/lib/whatsapp-templates";

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
  if (!WHATSAPP_TEMPLATE_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Unknown template slug" }, { status: 404 });
  }

  const row = await (prisma as any).whatsappTemplate.findUnique({ where: { slug } });
  const meta = WHATSAPP_TEMPLATE_META[slug];
  const template = {
    slug,
    name: meta?.name ?? row?.name ?? slug,
    description: meta?.description ?? row?.description ?? undefined,
    body: row?.body ?? meta?.defaultBody ?? "",
    updatedAt: (row as any)?.updatedAt?.toISOString() ?? null,
    updatedBy: (row as any)?.updatedBy ?? null,
  };

  return NextResponse.json(template);
}

/** PATCH – update body. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { slug } = await params;
  if (!WHATSAPP_TEMPLATE_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Unknown template slug" }, { status: 404 });
  }

  const body = await req.json();
  const templateBody = typeof body.body === "string" ? body.body : undefined;

  if (templateBody === undefined) {
    return NextResponse.json(
      { error: "body required" },
      { status: 400 }
    );
  }

  const meta = WHATSAPP_TEMPLATE_META[slug];
  const updated = await (prisma as any).whatsappTemplate.upsert({
    where: { slug },
    update: {
      body: templateBody,
      updatedBy: (auth.session.user as { id?: string })?.id ?? undefined,
    },
    create: {
      slug,
      name: meta?.name ?? slug,
      description: meta?.description ?? undefined,
      body: templateBody,
      updatedBy: (auth.session.user as { id?: string })?.id ?? undefined,
    },
  });

  return NextResponse.json({
    slug: updated.slug,
    name: updated.name,
    description: updated.description ?? undefined,
    body: updated.body,
    updatedAt: updated.updatedAt.toISOString(),
    updatedBy: updated.updatedBy ?? null,
  });
}
