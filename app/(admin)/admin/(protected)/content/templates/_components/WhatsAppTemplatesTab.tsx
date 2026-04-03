"use client";

import Link from "next/link";

interface WhatsAppTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  bodyText: string;
  updatedAt: string;
}

export function WhatsAppTemplatesTab({ templates, query }: { templates: WhatsAppTemplate[], query: string }) {
  const filtered = query 
    ? templates.filter(t => {
        const name = (t.name ?? t.slug).toLowerCase();
        const desc = (t.description ?? "").toLowerCase();
        return name.includes(query) || desc.includes(query) || t.slug.includes(query);
      })
    : templates;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left p-4 font-semibold text-slate-700">Template</th>
            <th className="text-left p-4 font-semibold text-slate-700">Category</th>
            <th className="text-left p-4 font-semibold text-slate-700">Description</th>
            <th className="text-left p-4 font-semibold text-slate-700">Last updated</th>
            <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => (
            <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
              <td className="p-4">
                <div className="font-medium text-slate-900">{t.name ?? t.slug}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{t.slug}</div>
              </td>
              <td className="p-4">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                  {t.category ?? "UTILITY"}
                </span>
              </td>
              <td className="p-4 text-slate-500 max-w-xs truncate">{t.description ?? "—"}</td>
              <td className="p-4 text-slate-500">
                {new Date(t.updatedAt).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="p-4 text-right hover:scale-105 transition-transform">
                <Link
                  href={`/admin/content/templates/whatsapp/${t.slug}`}
                  className="text-primary font-medium hover:underline px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
           {filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-500 italic">No WhatsApp templates found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
