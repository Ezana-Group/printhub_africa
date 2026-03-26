export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { WHATSAPP_TEMPLATE_META, WHATSAPP_TEMPLATE_SLUGS } from "@/lib/whatsapp-templates";
import { TemplateTabs } from "@/components/admin/content/template-tabs";

export default async function AdminContentWhatsAppTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireAdminSettings();
  const { q: qRaw } = await searchParams;
  
  // Fetch rows from DB. Handle case where table might not exist yet during migration.
  const rows = await prisma.whatsappTemplate.findMany({
    orderBy: { slug: "asc" },
  }).catch(() => []);
  
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const q = typeof qRaw === "string" ? qRaw.trim().toLowerCase() : "";
  const slugsToShow = q
    ? WHATSAPP_TEMPLATE_SLUGS.filter((slug) => {
        const meta = WHATSAPP_TEMPLATE_META[slug];
        const row = bySlug.get(slug);
        const name = (meta?.name ?? row?.name ?? slug).toLowerCase();
        const desc = (meta?.description ?? row?.description ?? "").toLowerCase();
        const body = (row?.body ?? meta?.defaultBody ?? "").toLowerCase();
        return (
          slug.toLowerCase().includes(q) ||
          name.includes(q) ||
          desc.includes(q) ||
          body.includes(q)
        );
      })
    : WHATSAPP_TEMPLATE_SLUGS;

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "WhatsApp Templates" },
        ]}
      />
      
      <TemplateTabs />
      
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">WhatsApp Templates</h1>
        <p className="text-slate-600 text-sm mt-1">
          Edit the pre-filled messages for WhatsApp links. Use placeholders like {`{{quoteNumber}}`}, {`{{orderNumber}}`}.
        </p>
        <form method="GET" className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-xl">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search templates…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Search
          </button>
          {q ? (
            <Link href="/admin/content/whatsapp-templates" className="text-sm text-muted-foreground hover:text-slate-900">
              Clear
            </Link>
          ) : null}
        </form>
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
            {slugsToShow.map((slug) => {
              const meta = WHATSAPP_TEMPLATE_META[slug];
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
                      href={`/admin/content/whatsapp-templates/${slug}`}
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
