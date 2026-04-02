export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCorporateAccount, getTermsDays, getTierColour } from "@/lib/corporate";
import { Building2, FileText, Image as ImageIcon, Package, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default async function CorporateDashboardPage() {
  try {

  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) redirect("/login");

  const corporate = await getCorporateAccount();
  if (!corporate) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Corporate dashboard</h1>
        <div className="rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">
            You don&apos;t have an approved corporate account. Apply for one to get net terms, volume discounts, and dedicated support.
          </p>
          <Link
            href="/account/settings/corporate"
            className="inline-flex items-center mt-4 text-[#E8440A] font-medium hover:underline"
          >
            Corporate account settings
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (corporate.status !== "APPROVED") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Corporate dashboard</h1>
        <div className="rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-slate-600">
            Your corporate application is still under review. We&apos;ll contact you at your registered email once approved.
          </p>
          <Link href="/account/settings/corporate" className="inline-flex items-center mt-4 text-[#E8440A] font-medium hover:underline">
            View application
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const [recentOrders, invoicesCount, brandAssetsCount] = await Promise.all([
    prisma.order.findMany({
      where: { corporateId: corporate.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: { take: 3 } },
    }),
    prisma.corporateInvoice.count({ where: { corporateId: corporate.id } }),
    prisma.corporateBrandAsset.count({ where: { corporateId: corporate.id, isActive: true } }),
  ]);

  const availableCredit = Math.max(0, corporate.creditLimit - corporate.creditUsed);
  const termsDays = getTermsDays(corporate.paymentTerms);
  const termsLabel =
    corporate.paymentTerms === "PREPAID"
      ? "Prepaid"
      : corporate.paymentTerms === "ON_DELIVERY"
        ? "On delivery"
        : `Net-${termsDays}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Corporate dashboard</h1>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getTierColour(corporate.tier)}`}
        >
          {corporate.tier}
        </span>
      </div>

      {/* Company & credit */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{corporate.companyName}</h2>
            <p className="text-sm text-slate-500">Account {corporate.accountNumber}</p>
            <p className="text-sm text-slate-600 mt-1">
              Payment terms: {termsLabel} · Discount: {corporate.discountPercent}%
            </p>
          </div>
        </div>
        {corporate.creditLimit > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Credit</span>
              <span className="font-medium">
                {formatPrice(availableCredit)} available of {formatPrice(corporate.creditLimit)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-[#E8440A] rounded-full transition-all"
                style={{
                  width: `${corporate.creditLimit ? Math.min(100, (corporate.creditUsed / corporate.creditLimit) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Used: {formatPrice(corporate.creditUsed)}</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Corporate orders</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{recentOrders.length}</p>
            </div>
            <Package className="h-6 w-6 text-slate-400 group-hover:text-[#E8440A]" />
          </div>
          <p className="text-xs text-slate-500 mt-2">View orders placed on this account</p>
        </Link>
        <Link
          href="/account/corporate/invoices"
          className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Invoices</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{invoicesCount}</p>
            </div>
            <FileText className="h-6 w-6 text-slate-400 group-hover:text-[#E8440A]" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Monthly statements</p>
        </Link>
        <Link
          href="/account/corporate/brand-assets"
          className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Brand assets</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{brandAssetsCount}</p>
            </div>
            <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-[#E8440A]" aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Logos & files</p>
        </Link>
      </div>

      {/* Recent corporate orders */}
      <div className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center text-sm font-medium text-[#E8440A] hover:underline"
          >
            View all
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No orders yet on this account.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <Link href={`/account/orders/${order.id}`} className="font-mono text-[#E8440A] hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString("en-KE")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{order.status}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatPrice(Number(order.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
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
