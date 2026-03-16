import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { EMAIL_TEMPLATE_META, EMAIL_TEMPLATE_SLUGS } from "@/lib/email-templates";

export default async function AdminContentEmailTemplatesPage() {
  await requireAdminSettings();
  const rows = await prisma.emailTemplate.findMany({
    orderBy: { slug: "asc" },
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Email Templates" },
        ]}
      />
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Email Templates</h1>
        <p className="text-slate-600 text-sm mt-1">
          Edit subject and body for automated emails. Use placeholders like {`{{businessName}}`}, {`{{orderNumber}}`} in subject and body.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Template</th>
              <th className="text-left p-4 font-semibold text-slate-700">Description</th>
              <th className="text-left p-4 font-semibold text-slate-700">Last updated</th>
              <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {EMAIL_TEMPLATE_SLUGS.map((slug) => {
              const meta = EMAIL_TEMPLATE_META[slug];
              const row = bySlug.get(slug);
              return (
                <tr key={slug} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">{meta?.name ?? row?.name ?? slug}</td>
                  <td className="p-4 text-slate-500 max-w-xs truncate">{meta?.description ?? "—"}</td>
                  <td className="p-4 text-slate-500">
                    {row?.updatedAt
                      ? new Date(row.updatedAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/content/email-templates/${slug}`}
                      className="text-primary font-medium hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
