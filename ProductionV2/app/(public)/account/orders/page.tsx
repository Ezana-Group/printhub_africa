"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  itemCount: number;
}

export default function AccountOrdersPage() {
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [authStatus]);

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
      <Link href="/account" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to account</Link>

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
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold text-slate-900">{o.orderNumber}</p>
                <p className="text-sm text-slate-500">
                  {new Date(o.createdAt).toLocaleDateString()} · {o.itemCount} item(s)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{o.status}</span>
                <span className="font-semibold text-slate-900">{formatPrice(o.total)}</span>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href={`/account/orders/${o.id}`}>View</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
