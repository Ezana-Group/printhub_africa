"use client";

import Link from "next/link";
import { EMAIL_TEMPLATE_META } from "@/lib/email-templates";

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  updatedAt: string;
}

export function EmailTemplatesTab({ templates, query }: { templates: EmailTemplate[], query: string }) {
  const filtered = query 
    ? templates.filter(t => {
        const meta = EMAIL_TEMPLATE_META[t.slug];
        const name = (meta?.name ?? t.name ?? t.slug).toLowerCase();
        const desc = (meta?.description ?? t.description ?? "").toLowerCase();
        return name.includes(query) || desc.includes(query) || t.slug.includes(query);
      })
    : templates;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
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
          {filtered.map((t) => {
            const meta = EMAIL_TEMPLATE_META[t.slug];
            return (
               <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{meta?.name ?? t.name ?? t.slug}</td>
                <td className="p-4 text-slate-500 max-w-xs truncate">{meta?.description ?? t.description ?? "—"}</td>
                <td className="p-4 text-slate-500">
                  {new Date(t.updatedAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/admin/content/email-templates/${t.slug}`}
                    className="text-primary font-medium hover:underline px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-500 italic">No email templates found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
