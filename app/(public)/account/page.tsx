import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Package, MapPin, ClipboardList, ChevronRight } from "lucide-react";
import { RecentOrdersTable } from "@/components/account/recent-orders-table";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;
  const name = session.user.name ?? session.user.email ?? "Customer";

  const [user, totalOrders, pendingOrders, addressesCount, recentOrders] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
      prisma.order.count({ where: { userId } }),
      prisma.order.count({
        where: {
          userId,
          status: { notIn: ["DELIVERED", "CANCELLED", "REFUNDED"] },
        },
      }),
      prisma.savedAddress.count({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: true,
        },
      }),
    ]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-KE", {
        month: "long",
        year: "numeric",
      })
    : null;

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Welcome card */}
      <div
        className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8440A]/15 text-lg font-semibold text-[#E8440A]"
            aria-hidden
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Welcome, {name}</h1>
            {memberSince && (
              <p className="mt-0.5 text-sm text-slate-500">
                Member since {memberSince}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/account/orders"
          className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {totalOrders}
              </p>
            </div>
            <div className="rounded-xl bg-[#E8440A]/10 p-2.5 text-[#E8440A] group-hover:bg-[#E8440A]/20">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </Link>
        <Link
          href="/account/orders"
          className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Orders</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {pendingOrders}
              </p>
            </div>
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 group-hover:bg-amber-200">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
        </Link>
        <Link
          href="/account/settings/addresses"
          className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saved Addresses</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {addressesCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 group-hover:bg-slate-200">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent orders table */}
      <div
        className="rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center text-sm font-medium text-[#E8440A] hover:underline"
          >
            View all
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <RecentOrdersTable orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}
