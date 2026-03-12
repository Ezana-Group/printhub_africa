"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string; slug: string; images: string[] } | null;
  }>;
  shippingAddress: { fullName: string; email: string; phone: string; street: string; city: string; county: string; postalCode?: string } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !params.id) return;
    fetch(`/api/orders/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [authStatus, params.id]);

  if (authStatus === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const canCancel = order && ["PENDING", "CONFIRMED"].includes(order.status);

  async function handleCancel() {
    if (!order?.id || !canCancel) return;
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancelReason: "Cancelled by customer" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to cancel");
        return;
      }
      setOrder((o) => (o ? { ...o, status: "CANCELLED" } : null));
    } finally {
      setCancelling(false);
    }
  }

  if (loading || !order) {
    return (
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <p className="text-slate-600">{loading ? "Loading..." : "Order not found."}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <h1 className="font-display text-2xl font-bold text-slate-900">Order {order.orderNumber}</h1>
      <p className="text-slate-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
      <Link href="/account/orders" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to orders</Link>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Items</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product?.name ?? "Product"} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
          {order.shippingAddress && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Shipping address</h2>
              <p className="mt-2 text-slate-600">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.county}
                {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}<br />
                {order.shippingAddress.phone}<br />
                {order.shippingAddress.email}
              </p>
            </div>
          )}
        </div>
        <div className="w-full lg:w-80">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sticky top-24">
            <p className="text-sm font-medium text-slate-700">Status</p>
            <p className="mt-1 rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-800">{order.status}</p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Tax</dt><dd>{formatPrice(order.tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-600">Shipping</dt><dd>{formatPrice(order.shippingCost)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-slate-600">Discount</dt><dd>-{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
            {canCancel && (
              <Button
                variant="destructive"
                className="mt-4 w-full rounded-xl"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? "Cancelling..." : "Cancel order"}
              </Button>
            )}
            <Button asChild variant="outline" className="mt-4 w-full rounded-xl" size="sm">
              <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                Download invoice
              </a>
            </Button>
            <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
              <Link href="/shop">Order again</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
