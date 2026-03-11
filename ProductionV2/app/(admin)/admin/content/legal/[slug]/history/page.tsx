import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

export default async function LegalPageHistoryPage({
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
    orderBy: { savedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Legal Pages", href: "/admin/content/legal" },
          { label: page.title, href: `/admin/content/legal/${slug}/edit` },
          { label: "History" },
        ]}
      />
      <h1 className="font-display text-2xl font-bold">
        History — {page.title}
      </h1>
      <Link
        href={`/admin/content/legal/${slug}/edit`}
        className="text-sm text-primary hover:underline"
      >
        ← Back to editor
      </Link>
      <ul className="space-y-4">
        {history.map((h) => (
          <li
            key={h.id}
            className="rounded-lg border p-4 text-sm"
          >
            <p className="font-medium">
              v{h.version} · {new Date(h.savedAt).toLocaleString()}
            </p>
            {h.changeNote && (
              <p className="text-muted-foreground mt-1">{h.changeNote}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
