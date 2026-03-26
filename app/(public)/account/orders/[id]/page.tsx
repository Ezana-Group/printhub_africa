"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  trackingNumber?: string | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string; slug: string; images: string[] } | null;
  }>;
  shippingAddress: { fullName: string; email: string; phone: string; street: string; city: string; county: string; postalCode?: string } | null;
  delivery?: {
    status: string;
    estimatedDelivery?: string | null;
    dispatchedAt?: string | null;
    deliveredAt?: string | null;
    rescheduledTo?: string | null;
    trackingNumber?: string | null;
    assignedCourier?: { name: string; trackingUrl?: string | null; phone?: string | null } | null;
  } | null;
  trackingEvents?: Array<{ status: string; title: string; description?: string | null; createdAt: string; isPublic?: boolean }>;
  invoices?: Array<{ id: string; invoiceNumber: string; issuedAt: string }>;
  refunds?: Array<{ id: string; refundNumber?: string | null; amount: number; status: string; createdAt: string }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState<string | null>(null);
  const [businessNumber, setBusinessNumber] = useState("254727410320");

  useEffect(() => {
    if (authStatus !== "authenticated" || !params.id) return;
    
    // Fetch order
    fetch(`/api/orders/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));

    // Fetch template & business settings (can use public endpoints)
    fetch("/api/admin/whatsapp-templates/order-enquiry") // We should probably make a public one, but let's try this or use a default
      .then(res => res.json())
      .then(data => setWhatsappTemplate(data.body))
      .catch(() => {});
      
    // For now, I'll just use a fallback for the number as well or fetch from a public config if available
  }, [authStatus, params.id]);

  if (authStatus === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const canCancel = order && ["PENDING", "CONFIRMED"].includes(order.status);

  async function handleCancel() {
    if (!order?.id || !canCancel) return;
    setShowCancelModal(true);
  }

  async function confirmCancel() {
    if (!order?.id || !canCancel) return;
    const reason = cancelReason.trim() || "Cancelled by customer";
    setCancelling(true);
    setShowCancelModal(false);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancelReason: reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to cancel");
        return;
      }
      setOrder((o) => (o ? { ...o, status: "CANCELLED" } : null));
    } finally {
      setCancelling(false);
      setCancelReason("");
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
          {(order.delivery || order.trackingEvents?.length) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Delivery</h2>
              {/* Delivery timeline */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { key: "placed", label: "Order placed", date: order.createdAt, done: true },
                  { key: "dispatched", label: "Dispatched", date: order.delivery?.dispatchedAt ?? null, done: ["DISPATCHED", "IN_TRANSIT", "DELIVERED"].includes(order.delivery?.status ?? "") },
                  { key: "transit", label: "In transit", date: null, done: ["IN_TRANSIT", "DELIVERED"].includes(order.delivery?.status ?? "") },
                  { key: "delivered", label: "Delivered", date: order.delivery?.deliveredAt ?? null, done: order.delivery?.status === "DELIVERED" },
                ].map((step) => (
                  <div key={step.key} className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${step.done ? "bg-green-500" : "bg-slate-200"}`} />
                    <span className={`text-sm ${step.done ? "text-slate-900 font-medium" : "text-slate-400"}`}>
                      {step.label}
                      {step.date && <span className="text-slate-500 font-normal"> · {new Date(step.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                    </span>
                  </div>
                ))}
              </div>
              {(order.delivery?.rescheduledTo || order.estimatedDelivery) && (
                <p className="mt-2 text-slate-600 text-sm">
                  {order.delivery?.rescheduledTo ? (
                    <>Rescheduled to: {new Date(order.delivery.rescheduledTo).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</>
                  ) : (
                    <>Estimated: {new Date(order.estimatedDelivery!).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</>
                  )}
                </p>
              )}
              {order.trackingNumber && (
                <p className="mt-1 text-slate-600">
                  Tracking: {order.delivery?.assignedCourier?.trackingUrl ? (
                    <a href={order.delivery.assignedCourier.trackingUrl.replace("{tracking}", order.trackingNumber)} target="_blank" rel="noopener noreferrer" className="text-primary underline">{order.trackingNumber}</a>
                  ) : (
                    order.trackingNumber
                  )}
                </p>
              )}
              {order.delivery?.assignedCourier?.name && !order.trackingNumber && (
                <p className="mt-1 text-slate-600">Courier: {order.delivery.assignedCourier.name}</p>
              )}
              {order.trackingEvents && order.trackingEvents.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {order.trackingEvents.filter((e) => e.isPublic !== false).map((ev, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-slate-400 shrink-0">{new Date(ev.createdAt).toLocaleDateString()}</span>
                      <span className="font-medium">{ev.title}</span>
                      {ev.description && <span className="text-slate-600">— {ev.description}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
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
            {order.status === "PENDING" && (
              <Button asChild className="mt-4 w-full rounded-xl bg-[#E8440A] hover:bg-[#E8440A]/90">
                <Link href={`/pay/${order.id}`}>Pay now</Link>
              </Button>
            )}
            {(order.refunds?.length ?? 0) > 0 && (
              <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm">
                <p className="font-medium text-amber-900">Refund status</p>
                {order.refunds!.map((r) => (
                  <p key={r.id} className="text-amber-800 mt-0.5">
                    {r.refundNumber ? `${r.refundNumber} · ` : ""}KES {r.amount.toLocaleString()} — {r.status}
                  </p>
                ))}
              </div>
            )}
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
            {(order.invoices?.length ?? 0) > 0 ? (
              <Button asChild variant="outline" className="mt-4 w-full rounded-xl" size="sm">
                <a href={`/api/invoices/${order.invoices![0].id}/download`} target="_blank" rel="noopener noreferrer">
                  Download Tax Invoice ({order.invoices![0].invoiceNumber})
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline" className="mt-4 w-full rounded-xl" size="sm">
                <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                  Download invoice
                </a>
              </Button>
            )}
            <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
              <Link href="/shop">Order again</Link>
            </Button>

            <a
              href={`https://wa.me/${businessNumber}?text=${encodeURIComponent(
                (whatsappTemplate || "Hi PrintHub, I have an enquiry about order {{orderNumber}}.")
                  .replace("{{orderNumber}}", order.orderNumber)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-all"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Order enquiry
            </a>
          </div>
        </div>
      </div>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel order</DialogTitle>
            <DialogDescription>This cannot be undone. Optionally select a reason.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-sm">Reason (optional)</Label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Select —</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Found better price elsewhere">Found better price elsewhere</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Delivery address wrong">Delivery address wrong</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>Back</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
