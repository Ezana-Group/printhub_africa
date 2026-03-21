export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { LegalPageEditorClient } from "./legal-editor-client";

export default async function LegalPageEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSettings();
  const { slug } = await params;
  const page = await prisma.legalPage.findUnique({ where: { slug } });
  if (!page) notFound();

  const history = await prisma.legalPageHistory.findMany({
    where: { legalPageId: page.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-4">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Legal Pages", href: "/admin/content/legal" },
          { label: page.title ?? slug },
        ]}
      />
      <div className="flex items-center gap-4">
        <Link
          href="/admin/content/legal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Legal Pages
        </Link>
      </div>
      <LegalPageEditorClient
        slug={page.slug}
        title={page.title ?? page.slug}
        content={page.content}
        version={page.version}
        lastUpdated={page.lastUpdated ?? ""}
        isPublished={page.isPublished}
        history={history.map((h) => ({
          id: h.id,
          version: h.version,
          savedAt: h.createdAt,
          savedBy: h.savedBy,
          changeNote: h.changeNote,
        }))}
      />
    </div>
  );
}
