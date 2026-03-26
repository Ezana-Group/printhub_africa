export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { WHATSAPP_TEMPLATE_META, WHATSAPP_TEMPLATE_SLUGS } from "@/lib/whatsapp-templates";
import { WhatsAppTemplateEditorClient } from "./whatsapp-template-editor-client";

export default async function WhatsAppTemplateEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSettings();
  const { slug } = await params;
  if (!WHATSAPP_TEMPLATE_SLUGS.includes(slug)) notFound();

  const row = await prisma.whatsappTemplate.findUnique({ where: { slug } }).catch(() => null);
  const meta = WHATSAPP_TEMPLATE_META[slug];
  const name = meta?.name ?? row?.name ?? slug;
  const description = meta?.description ?? row?.description ?? undefined;
  const body = row?.body ?? meta?.defaultBody ?? "";

  return (
    <div className="space-y-4">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "WhatsApp Templates", href: "/admin/content/whatsapp-templates" },
          { label: name },
        ]}
      />
      <div className="flex items-center gap-4">
        <Link
          href="/admin/content/whatsapp-templates"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to WhatsApp Templates
        </Link>
      </div>
      <WhatsAppTemplateEditorClient
        slug={slug}
        name={name}
        description={description ?? ""}
        initialBody={body}
      />
    </div>
  );
}
