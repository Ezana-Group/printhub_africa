"use client";

import Link from "next/link";
import { FileText, ExternalLink, Code2, Info } from "lucide-react";

interface PdfTemplate {
  slug: string;
  name: string;
  description: string;
  filePath: string;
  previewHref?: string;
}

const PDF_TEMPLATES: PdfTemplate[] = [
  {
    slug: "invoice",
    name: "Invoice PDF",
    description: "Sent to customers when an invoice is issued. Includes order lines, totals, VAT, and business details.",
    filePath: "/components/pdf/InvoicePDF.tsx",
    previewHref: "/admin/finance/invoices",
  },
  {
    slug: "quote",
    name: "Quote PDF",
    description: "Sent to customers when a quote is approved. Includes quote lines, pricing, validity, and terms.",
    filePath: "/components/pdf/InvoicePDF.tsx",
    previewHref: "/admin/quotes",
  },
  {
    slug: "delivery-note",
    name: "Delivery Note",
    description: "Attached to shipments and pickups. Includes order ID, customer details, items, and delivery info.",
    filePath: "/components/pdf/InvoicePDF.tsx",
    previewHref: "/admin/deliveries",
  },
];

interface PdfTemplatesTabProps {
  query: string;
}

export function PdfTemplatesTab({ query }: PdfTemplatesTabProps) {
  const filtered = query
    ? PDF_TEMPLATES.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.slug.includes(query)
      )
    : PDF_TEMPLATES;

  return (
    <div className="space-y-4 mt-6">
      {/* Info banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-white shadow-sm shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Code-based PDF templates</p>
          <p className="text-blue-700/80 mt-0.5">
            PDF templates use <code className="text-blue-900 bg-blue-100 px-1 rounded">@react-pdf/renderer</code> for precise,
            print-ready output. Edit the source file in your code editor and redeploy to update styles and layout.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Template</th>
              <th className="text-left p-4 font-semibold text-slate-700">Description</th>
              <th className="text-left p-4 font-semibold text-slate-700">Source File</th>
              <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.slug}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500 shrink-0" />
                    <span className="font-medium text-slate-900">{t.name}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-500 max-w-xs">{t.description}</td>
                <td className="p-4">
                  <code className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {t.filePath}
                  </code>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {t.previewHref && (
                      <Link
                        href={t.previewHref}
                        className="inline-flex items-center gap-1.5 text-slate-600 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Preview
                      </Link>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-orange-600 font-medium px-3 py-1.5 rounded-lg bg-orange-50 text-xs">
                      <Code2 className="h-3.5 w-3.5" />
                      Code only
                    </span>
                  </div>
                </td>
              </tr>
            ))}
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
