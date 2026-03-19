import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { EMAIL_TEMPLATE_META, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";
import { EmailTemplateEditorClient } from "./email-template-editor-client";

export default async function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSettings();
  const { slug } = await params;
  if (!EMAIL_TEMPLATE_SLUGS.includes(slug)) notFound();

  const row = await prisma.emailTemplate.findUnique({ where: { slug } });
  const meta = EMAIL_TEMPLATE_META[slug];
  const name = meta?.name ?? row?.name ?? slug;
  const description = meta?.description ?? row?.description ?? undefined;
  const subject = row?.subject ?? "";
  const bodyHtml = row?.bodyHtml ?? "";

  return (
    <div className="space-y-4">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Email Templates", href: "/admin/content/email-templates" },
          { label: name },
        ]}
      />
      <div className="flex items-center gap-4">
        <Link
          href="/admin/content/email-templates"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Email Templates
        </Link>
      </div>
      <EmailTemplateEditorClient
        slug={slug}
        description={description ?? ""}
        initialSubject={subject}
        initialBodyHtml={bodyHtml}
      />
    </div>
  );
}
