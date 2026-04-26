"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { DeleteOrderButton } from "@/components/account/delete-order-button";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  itemCount: number;
}

type TabKey = "pending" | "completed" | "archived";

const PENDING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PRINTING",
  "QUALITY_CHECK",
  "READY_FOR_COLLECTION",
  "SHIPPED",
];
const COMPLETED_STATUSES = ["DELIVERED", "REFUNDED"];
const ARCHIVED_STATUSES = ["CANCELLED"];

function getTabForStatus(status: string): TabKey {
  const s = status.toUpperCase();
  if (PENDING_STATUSES.includes(s)) return "pending";
  if (COMPLETED_STATUSES.includes(s)) return "completed";
  if (ARCHIVED_STATUSES.includes(s)) return "archived";
  return "pending";
}

function filterOrdersByTab(orders: OrderRow[], tab: TabKey): OrderRow[] {
  if (tab === "pending") return orders.filter((o) => getTabForStatus(o.status) === "pending");
  if (tab === "completed") return orders.filter((o) => getTabForStatus(o.status) === "completed");
  if (tab === "archived") return orders.filter((o) => getTabForStatus(o.status) === "archived");
  return orders;
}

const TABS: { key: TabKey; label: string; bgColor: string; textColor: string }[] = [
  { key: "pending", label: "Pending orders", bgColor: "#FFF3E0", textColor: "#E65100" },
  { key: "completed", label: "Completed orders", bgColor: "#E8F5E9", textColor: "#2E7D32" },
  { key: "archived", label: "Archived orders", bgColor: "#EDE7F6", textColor: "#4527A0" },
];

export default function AccountOrdersPage() {
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const refetch = () => {
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [authStatus]);

  const filtered = filterOrdersByTab(orders, activeTab);

  if (authStatus === "unauthenticated" || authStatus === "loading") {
    return (
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <h1 className="font-display text-2xl font-bold text-slate-900">My Orders</h1>
      <p className="text-slate-600 mt-1">View and track your orders.</p>
      <Link href="/account" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Back to account
      </Link>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No orders yet.</p>
          <Button asChild className="mt-4 rounded-xl">
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex w-full gap-3 overflow-x-auto rounded-xl bg-slate-50 p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ key, label, bgColor, textColor }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === key
                    ? "bg-[#CC3D00] text-white shadow-sm"
                    : "hover:brightness-95"
                }`}
                style={activeTab === key ? undefined : { backgroundColor: bgColor, color: textColor }}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No orders in this tab.</p>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {filtered.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{o.orderNumber}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {o.status}
                    </span>
                    <span className="font-semibold text-slate-900">{formatPrice(o.total)}</span>
                    <DeleteOrderButton
                      orderId={o.id}
                      orderNumber={o.orderNumber}
                      status={o.status}
                      onDeleted={refetch}
                    />
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <Link href={`/account/orders/${o.id}`}>View</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
