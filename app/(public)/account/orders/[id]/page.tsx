"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

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
  refunds?: Array<{ 
    id: string; 
    refundNumber?: string | null; 
    amount: number; 
    status: string; 
    createdAt: string;
    mpesaReceiptNo?: string | null;
    rejectionReason?: string | null;
  }>;
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
              <div className="mt-6 space-y-4">
                <p className="text-sm font-semibold text-slate-900 px-1">Refund Status</p>
                {order.refunds!.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                          {r.refundNumber || "REFUND"}
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatPrice(r.amount)}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`font-bold px-2.5 py-0.5 rounded-full ${
                          r.status === "COMPLETED" ? "bg-green-100 text-green-800 border-green-200" :
                          r.status === "FAILED" || r.status === "REJECTED" ? "bg-red-100 text-red-800 border-red-200" :
                          "bg-amber-100 text-amber-900 border-amber-200"
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-amber-100">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Created: {new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {r.status === "COMPLETED" && r.mpesaReceiptNo && (
                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>M-Pesa Receipt: <strong>{r.mpesaReceiptNo}</strong></span>
                        </div>
                      )}

                      {r.status === "REJECTED" && (order as any).rejectionReason && (
                        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-100">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
                          <div>
                            <p className="font-semibold">Refund Denied</p>
                            <p>{(order as any).rejectionReason}</p>
                          </div>
                        </div>
                      )}

                      {r.status === "PENDING" && (
                        <p className="text-[11px] text-amber-700 leading-relaxed italic">
                          Our finance team is currently reviewing your request. This usually takes 1-2 business days.
                        </p>
                      )}
                    </div>
                  </div>
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
