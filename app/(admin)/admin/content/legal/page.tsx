import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

export default async function AdminContentLegalPage() {
  await requireAdminSettings();
  const pages = await prisma.legalPage.findMany({
    orderBy: { slug: "asc" },
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Legal Pages" },
        ]}
      />
      <h1 className="font-display text-2xl font-bold">Legal Pages</h1>
      <p className="text-muted-foreground text-sm">
        Edit the legal pages shown on your website. Changes go live immediately.
      </p>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Page</th>
              <th className="text-left p-3 font-medium">Last Updated</th>
              <th className="text-left p-3 font-medium">Version</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.title}</td>
                <td className="p-3 text-muted-foreground">
                  {new Date(p.lastUpdated).toLocaleString("en-KE")}
                </td>
                <td className="p-3">v{p.version}</td>
                <td className="p-3 flex gap-2">
                  <Link
                    href={`/admin/content/legal/${p.slug}/edit`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  <a
                    href={`/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View ↗
                  </a>
                  <Link
                    href={`/admin/content/legal/${p.slug}/history`}
                    className="text-primary hover:underline"
                  >
                    History
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
