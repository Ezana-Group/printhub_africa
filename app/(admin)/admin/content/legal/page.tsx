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
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Legal Pages</h1>
        <p className="text-slate-600 text-sm mt-1">
          Edit the legal pages shown on your website. Changes go live when you save & publish.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Page</th>
              <th className="text-left p-4 font-semibold text-slate-700">Last updated</th>
              <th className="text-left p-4 font-semibold text-slate-700">Version</th>
              <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="p-4 font-medium text-slate-900">{p.title ?? p.slug}</td>
                <td className="p-4 text-slate-500">
                  {p.lastUpdated
                    ? new Date(p.lastUpdated).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="p-4 text-slate-500">v{p.version}</td>
                <td className="p-4 text-right">
                  <span className="inline-flex items-center gap-3">
                    <Link
                      href={`/admin/content/legal/${p.slug}/edit`}
                      className="text-primary font-medium hover:underline"
                    >
                      Edit
                    </Link>
                    <a
                      href={`/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-primary hover:underline"
                    >
                      View live ↗
                    </a>
                    <Link
                      href={`/admin/content/legal/${p.slug}/history`}
                      className="text-slate-600 hover:text-primary hover:underline"
                    >
                      History
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
