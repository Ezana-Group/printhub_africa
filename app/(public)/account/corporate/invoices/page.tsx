import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCorporateAccount } from "@/lib/corporate";
import { prisma } from "@/lib/prisma";
import { FileText, ChevronLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time

export default async function CorporateInvoicesPage() {
  try {

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const corporate = await getCorporateAccount();
  if (!corporate || corporate.status !== "APPROVED") redirect("/account/corporate");

  const invoices = await prisma.corporateInvoice.findMany({
    where: { corporateId: corporate.id },
    orderBy: { periodEnd: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/account/corporate"
        className="inline-flex items-center text-sm text-slate-600 hover:text-[#E8440A]"
      >
        <ChevronLeft className="h-4 w-4 mr-0.5" />
        Back to corporate dashboard
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Corporate invoices</h1>
      <p className="text-slate-600 text-sm">
        Monthly statements for {corporate.companyName}. Pay by the due date per your {corporate.paymentTerms} terms.
      </p>
      {invoices.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No invoices yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Invoice</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Period</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Due</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(inv.periodStart).toLocaleDateString("en-KE")} – {new Date(inv.periodEnd).toLocaleDateString("en-KE")}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{new Date(inv.dueAt).toLocaleDateString("en-KE")}</td>
                  <td className="py-3 px-4 text-slate-600">{inv.status}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatPrice(inv.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-destructive/5 border border-destructive/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Service Temporarily Unavailable</h2>
          <p className="text-slate-600 mb-6">We are experiencing issues connecting to our services. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
