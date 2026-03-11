"use client";

import Link from "next/link";

type QuoteItem = {
  id: string;
  quoteNumber: string;
  type: string;
  status: string;
  projectName: string | null;
  quotedAmount: number | null;
  quotedAt: string | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-amber-100 text-amber-800",
  quoted: "bg-purple-100 text-purple-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  in_production: "bg-slate-200 text-slate-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export function QuotesListClient({
  quotes,
  typeLabels,
  formatPrice,
}: {
  quotes: QuoteItem[];
  typeLabels: Record<string, string>;
  formatPrice: (n: number) => string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Quote #</th>
              <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Type</th>
              <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Submitted</th>
              <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Status</th>
              <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Quoted amount</th>
              <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Action</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">{q.quoteNumber}</td>
                <td className="px-4 py-3 text-slate-600 sm:px-6">
                  {typeLabels[q.type] ?? q.type}
                </td>
                <td className="px-4 py-3 text-slate-600 sm:px-6">
                  {new Date(q.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 sm:px-6">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[q.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {q.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">
                  {q.quotedAmount != null ? formatPrice(q.quotedAmount) : "—"}
                </td>
                <td className="px-4 py-3 sm:px-6">
                  <Link
                    href={`/account/quotes/${q.id}`}
                    className="font-medium text-[#E8440A] hover:underline"
                  >
                    View
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
