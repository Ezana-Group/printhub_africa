"use client";

import Link from "next/link";
import { FileText, ExternalLink, Edit, Code2, Info, FileEdit } from "lucide-react";

interface PdfTemplate {
  slug: string;
  name: string;
  description: string;
  bodyHtml?: string;
  filePath?: string;
  previewHref?: string;
}

const STATIC_PDF_TEMPLATES: PdfTemplate[] = [
  {
    slug: "invoice",
    name: "Invoice PDF (System)",
    description: "Sent to customers when an invoice is issued. Includes order lines, totals, VAT.",
    filePath: "/components/pdf/InvoicePDF.tsx",
    previewHref: "/admin/finance/invoices",
  },
  {
    slug: "quote",
    name: "Quote PDF (System)",
    description: "Sent to customers when a quote is approved. Includes quote lines, pricing.",
    filePath: "/components/pdf/QuotePDF.tsx",
    previewHref: "/admin/quotes",
  },
  {
    slug: "delivery-note",
    name: "Delivery Note (System)",
    description: "Attached to shipments and pickups.",
    filePath: "/components/pdf/DeliveryNotePDF.tsx",
    previewHref: "/admin/deliveries",
  },
];

interface PdfTemplatesTabProps {
  templates?: PdfTemplate[];
  query: string;
}

export function PdfTemplatesTab({ templates = [], query }: PdfTemplatesTabProps) {
  const combined = [...templates, ...STATIC_PDF_TEMPLATES];

  const filtered = query
    ? combined.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.slug.includes(query)
      )
    : combined;

  return (
    <div className="space-y-4 mt-6">
      {/* Info banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-white shadow-sm shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-sm text-blue-800">
          <p className="font-semibold">PDF Templates Overview</p>
          <p className="text-blue-700/80 mt-0.5">
            You can now create UI-editable PDF layouts. Note that some internal system PDFs (Invoices, Quotes) are still generated using native code for precise layout formatting and must be edited in the source codebase.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Template</th>
              <th className="text-left p-4 font-semibold text-slate-700">Description</th>
              <th className="text-left p-4 font-semibold text-slate-700">Source</th>
              <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const isUIEditable = !t.filePath;
              return (
                <tr
                  key={t.slug}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className={`h-4 w-4 shrink-0 ${isUIEditable ? "text-orange-500" : "text-slate-400"}`} />
                      <span className="font-medium text-slate-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs">{t.description || "No description"}</td>
                  <td className="p-4">
                    {isUIEditable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        <FileEdit className="w-3 h-3" /> UI Editable
                      </span>
                    ) : (
                      <code className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {t.filePath}
                      </code>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isUIEditable ? (
                        <>
                          <Link
                            href={`/admin/content/pdf-templates/${t.slug}`}
                            className="inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Builder
                          </Link>
                          {/* We will route to the API preview rendering */}
                          <Link
                            href={`/api/admin/content/templates/pdf-preview/${t.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Preview
                          </Link>
                        </>
                      ) : (
                        <>
                          {t.previewHref && (
                            <Link
                              href={t.previewHref}
                              className="inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Preview List
                            </Link>
                          )}
                          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-xs cursor-default">
                            <Code2 className="h-3.5 w-3.5" />
                            Code Only
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                  No PDF templates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
