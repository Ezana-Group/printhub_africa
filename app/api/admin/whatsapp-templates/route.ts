import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { WHATSAPP_TEMPLATE_META, WHATSAPP_TEMPLATE_SLUGS } from "@/lib/whatsapp-templates";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

/** GET – list all WhatsApp templates. */
export async function GET() {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const rows = await (prisma as any).whatsappTemplate.findMany({
    orderBy: { slug: "asc" },
  });
  const bySlug = new Map((rows as any[]).map((r) => [r.slug, r]));

  const list = WHATSAPP_TEMPLATE_SLUGS.map((slug) => {
    const meta = WHATSAPP_TEMPLATE_META[slug];
    const row = bySlug.get(slug);
    return {
      slug,
      name: meta?.name ?? row?.name ?? slug,
      description: meta?.description ?? row?.description ?? undefined,
      body: row?.body ?? meta?.defaultBody ?? "",
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  });

  return NextResponse.json({ templates: list });
}
