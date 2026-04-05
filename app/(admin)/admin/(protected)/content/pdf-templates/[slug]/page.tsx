export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { PdfTemplateEditorClient } from "./pdf-template-editor-client";

export default async function PdfTemplateEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSettings();
  const { slug } = await params;

  const row = await prisma.pdfTemplate.findUnique({ where: { slug } });
  if (!row) notFound();

  const name = row.name ?? slug;
  const description = row.description ?? undefined;
  const bodyHtml = row.bodyHtml ?? "";

  return (
    <div className="p-6 lg:p-8 space-y-4">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/templates" },
          { label: "Templates", href: "/admin/content/templates" },
          { label: name },
        ]}
      />
      <div className="flex items-center gap-4">
        <Link
          href="/admin/content/templates?tab=pdf"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to PDF Templates
        </Link>
      </div>
      <PdfTemplateEditorClient
        slug={slug}
        description={description ?? ""}
        initialBodyHtml={bodyHtml}
      />
    </div>
  );
}
