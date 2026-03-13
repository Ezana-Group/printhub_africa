"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Package,
  MapPin,
  Truck,
  User,
  Phone,
  Mail,
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Activity,
  Download,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/utils";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "AWAITING_CONFIRMATION"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: string | number;
  product?: { name: string; images?: string[]; sku?: string | null } | null;
  productVariant?: {
    name: string;
    sku?: string | null;
    attributes?: Record<string, unknown>;
    image?: string | null;
  } | null;
};

type MpesaTransaction = {
  phoneNumber: string;
  mpesaReceiptNumber?: string | null;
  resultDesc?: string | null;
};

type Payment = {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount: string | number;
  paidAt?: string | null;
  manualReference?: string | null;
  proofFileId?: string | null;
  mpesaTransaction?: MpesaTransaction | null;
};

type ShippingAddress = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  county: string;
  postalCode?: string | null;
  deliveryMethod?: string | null;
};

type DeliveryRecord = {
  id: string;
  orderId: string;
  method: string;
  status: string;
  estimatedDelivery?: string | null;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
  trackingNumber?: string | null;
  failureReason?: string | null;
  rescheduledTo?: string | null;
  assignedCourierId?: string | null;
  assignedCourier?: { id: string; name: string; trackingUrl?: string | null; phone?: string | null } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  total: string | number;
  subtotal: string | number;
  tax: string | number;
  shippingCost: string | number;
  discount: string | number;
  currency: string;
  notes?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  paidAt?: string | null;
  mpesaFailureReason?: string | null;
  userId?: string | null;
  user?: { id: string; name?: string | null; email?: string | null; phone?: string | null } | null;
  items: OrderItem[];
  shippingAddress?: ShippingAddress | null;
  payments: Payment[];
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  pickupCode?: string | null;
  timeline: { id: string; status: string; message?: string | null; timestamp: string; updatedBy?: string | null }[];
  delivery?: DeliveryRecord | null;
  trackingEvents?: Array<{ status: string; title: string; description?: string | null; createdAt: string; isPublic?: boolean }>;
};

type TimelineEvent = {
  label: string;
  detail?: string | null;
  timestamp: string;
  type: "info" | "success" | "error" | "action";
  actor?: string | null;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return formatDate(dateStr);
}

function derivePaymentStatus(order: Order): PaymentStatus {
  if (order.paidAt) return "COMPLETED";
  const completed = order.payments.some((p) => p.status === "COMPLETED");
  if (completed) return "COMPLETED";
  const latest = order.payments[0];
  if (latest?.status === "FAILED") return "FAILED";
  return "PENDING";
}

const isAwaitingConfirmation = (order: Order) =>
  order.paymentStatus === "AWAITING_CONFIRMATION";
const isPayOnPickupPending = (order: Order) =>
  order.paymentMethod === "CASH_ON_PICKUP" && order.paymentStatus === "PENDING";

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant = status === "COMPLETED" ? "default" : status === "FAILED" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

const MANUAL_METHODS = [
  { value: "MPESA_MANUAL", label: "M-Pesa (confirmed manually)" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "Other" },
];

const CANCEL_REASONS = [
  { value: "PAYMENT_FAILED", label: "Payment not received" },
  { value: "CUSTOMER_REQUEST", label: "Customer requested cancellation" },
  { value: "OUT_OF_STOCK", label: "Item out of stock / material unavailable" },
  { value: "CANNOT_DELIVER", label: "Cannot deliver to this location" },
  { value: "DUPLICATE", label: "Duplicate order" },
  { value: "TEST_ORDER", label: "Test order" },
  { value: "OTHER", label: "Other" },
];

const CARRIERS = [
  { value: "G4S", label: "G4S" },
  { value: "POSTA", label: "Posta Kenya" },
  { value: "SENDY", label: "Sendy" },
  { value: "WELLS_FARGO", label: "Wells Fargo" },
  { value: "OWN", label: "Own delivery" },
];

export function OrderDetailClient({ orderId, initialOrder }: { orderId: string; initialOrder: Order | null }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(!initialOrder);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [manualPaymentModalOpen, setManualPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [manualMethod, setManualMethod] = useState("");
  const [manualRef, setManualRef] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [resendStkLoading, setResendStkLoading] = useState(false);
  const [confirmPaymentLoading, setConfirmPaymentLoading] = useState(false);
  const [, setWaitingForPayment] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [deliveryTracking, setDeliveryTracking] = useState("");
  const [deliveryCourierId, setDeliveryCourierId] = useState("");
  const [deliveryFailureReason, setDeliveryFailureReason] = useState("");
  const [deliveryRescheduleTo, setDeliveryRescheduleTo] = useState("");
  const [deliveryUpdateLoading, setDeliveryUpdateLoading] = useState(false);
  const [couriers, setCouriers] = useState<{ id: string; name: string; trackingUrl?: string | null }[]>([]);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${orderId}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
    }
  }, [orderId]);

  const fetchTimeline = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${orderId}/timeline`);
    if (res.ok) {
      const data = await res.json();
      setTimeline(data);
    }
  }, [orderId]);

  useEffect(() => {
    if (!initialOrder) {
      fetchOrder().finally(() => setLoading(false));
    }
  }, [initialOrder, fetchOrder]);

  useEffect(() => {
    if (order) fetchTimeline();
  }, [order, fetchTimeline]);

  useEffect(() => {
    if (order?.delivery) {
      fetch("/api/admin/settings/couriers")
        .then((r) => r.json())
        .then((data) => setCouriers(Array.isArray(data?.couriers) ? data.couriers : []))
        .catch(() => {});
    }
  }, [order?.delivery]);

  if (loading || !order) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading order…</p>
      </div>
    );
  }

  const paymentStatus = derivePaymentStatus(order);
  const totalKes = Number(order.total);
  const subtotalKes = Number(order.subtotal);
  const taxKes = Number(order.tax);
  const shippingKes = Number(order.shippingCost);
  const discountKes = Number(order.discount);
  const addr = order.shippingAddress;
  const guestPhone = addr?.phone ?? order.user?.phone ?? "";
  const guestEmail = addr?.email ?? order.user?.email ?? "";
  const deliveryName = addr?.fullName ?? order.user?.name ?? "Guest";
  const latestPayment = order.payments[0];
  const mpesaTransaction = latestPayment?.mpesaTransaction;

  const resendStk = async () => {
    setResendStkLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-stk`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setWaitingForPayment(true);
      await fetchOrder();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to resend M-Pesa prompt");
    }
    setResendStkLoading(false);
  };

  const copyPaymentLink = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await navigator.clipboard.writeText(data.url);
      alert("Payment link copied to clipboard.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate link");
    }
  };

  const confirmManualPayment = async () => {
    const amount = parseFloat(manualAmount);
    if (!manualMethod || Number.isNaN(amount) || amount <= 0) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/manual-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: manualMethod,
          reference: manualRef || undefined,
          amountKes: amount,
          notes: manualNotes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed");
      }
      setManualPaymentModalOpen(false);
      setManualMethod("");
      setManualRef("");
      setManualAmount("");
      setManualNotes("");
      await fetchOrder();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const updateStatus = async (status: string, extra?: { trackingNumber?: string; cancelReason?: string }) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (!res.ok) throw new Error("Failed");
      setCancelModalOpen(false);
      setShipModalOpen(false);
      await fetchOrder();
      fetchTimeline();
      router.refresh();
    } catch {
      alert("Failed to update status");
    }
  };

  const cancelOrder = async (reason: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed");
      }
      setCancelModalOpen(false);
      setCancelReason("");
      await fetchOrder();
      fetchTimeline();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to cancel order");
    }
  };

  const confirmPaymentAction = async (action: "CONFIRM" | "REJECT") => {
    setConfirmPaymentLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Failed");
      }
      await fetchOrder();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setConfirmPaymentLoading(false);
    }
  };

  const markShipped = () => {
    updateStatus("SHIPPED", { trackingNumber: trackingNumber || undefined });
    setTrackingNumber("");
    setCarrier("");
  };

  const printInvoice = () => {
    window.print();
  };

  const addNote = () => {
    const note = window.prompt("Internal note:");
    if (!note?.trim()) return;
    fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timelineMessage: note.trim() }),
    })
      .then((r) => r.ok && (fetchOrder(), fetchTimeline(), router.refresh()))
      .catch(() => alert("Failed to add note"));
  };

  const siteOrderUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/account/orders/${orderId}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">← Back to Orders</Link>
          </Button>
          <a
            href={siteOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View site order
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-bold">Order {order.orderNumber}</h1>
        <Badge variant="secondary">{order.type}</Badge>
        <Badge variant={order.status === "PENDING" ? "destructive" : "outline"}>{order.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>

      {paymentStatus === "FAILED" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Payment Failed</h3>
              <p className="text-sm text-red-600 mt-1">
                {order.mpesaFailureReason ??
                  "The M-Pesa payment was not completed. The customer may have cancelled, entered the wrong PIN, or had insufficient funds."}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setRecoveryModalOpen(true)}
                >
                  Recovery Options
                </Button>
                <Button size="sm" variant="outline" onClick={resendStk} disabled={resendStkLoading}>
                  Resend M-Pesa Prompt
                </Button>
                <Button size="sm" variant="outline" onClick={copyPaymentLink}>
                  Copy Payment Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAwaitingConfirmation(order) && latestPayment && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Manual payment pending confirmation</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Customer claims to have paid via {order.paymentMethod}. Reference:{" "}
                <span className="font-mono font-bold">{latestPayment.manualReference ?? "—"}</span>
              </p>
            </div>
          </div>
          {latestPayment.proofFileId && (
            <div className="mb-4">
              <a
                href={`/api/upload/${latestPayment.proofFileId}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <Download className="w-4 h-4" />
                View payment proof screenshot
              </a>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 mb-4 text-sm space-y-2">
            <p className="font-medium text-gray-700">To verify:</p>
            <ol className="list-inside list-decimal space-y-1 text-gray-600">
              <li>Log into M-Pesa business portal</li>
              <li>
                Search for reference:{" "}
                <span className="font-mono font-bold">{latestPayment.manualReference ?? "—"}</span>
              </li>
              <li>
                Confirm amount: <span className="font-bold">{formatPrice(totalKes)}</span>
              </li>
              <li>
                Confirm account: <span className="font-mono">{order.orderNumber}</span>
              </li>
            </ol>
          </div>
          <div className="flex gap-3">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={confirmPaymentLoading}
              onClick={() => confirmPaymentAction("CONFIRM")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm payment received
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={confirmPaymentLoading}
              onClick={() => confirmPaymentAction("REJECT")}
            >
              Reference not found
            </Button>
          </div>
        </div>
      )}

      {isPayOnPickupPending(order) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-900 mb-1">Pay on Pickup order</p>
          <p className="text-sm text-amber-700 mb-4">
            Customer pays when they collect. Verify their pickup code before confirming.
          </p>
          <div className="bg-white rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Customer pickup code</p>
            <p className="font-mono text-3xl font-bold text-gray-900 tracking-widest">
              {order.pickupCode ?? "—"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Ask customer to show this code before handing over the order
            </p>
          </div>
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={confirmPaymentLoading}
            onClick={() => confirmPaymentAction("CONFIRM")}
          >
            <Store className="w-4 h-4 mr-2" />
            Confirm collected and paid — {formatPrice(totalKes)}
          </Button>
        </div>
      )}

      {order.status !== "REFUNDED" &&
        (() => {
          const totalPaid = order.payments
            .filter((p: Payment) => p.status === "COMPLETED")
            .reduce((s: number, p: Payment) => s + Number(p.amount), 0);
          return totalPaid > 0;
        })() && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Issue refund</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customer will be notified by email and SMS. Process the payout (e.g. M-Pesa B2C) separately if needed.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3 max-w-sm"
              onSubmit={async (e) => {
                e.preventDefault();
                setRefundError(null);
                const amount = parseFloat(refundAmount);
                const totalPaid = order.payments
                  .filter((p: Payment) => p.status === "COMPLETED")
                  .reduce((s: number, p: Payment) => s + Number(p.amount), 0);
                if (Number.isNaN(amount) || amount < 0.01) {
                  setRefundError("Enter a valid amount");
                  return;
                }
                if (amount > totalPaid) {
                  setRefundError(`Amount cannot exceed ${formatPrice(totalPaid)}`);
                  return;
                }
                setRefundLoading(true);
                try {
                  const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount,
                      reason: refundReason.trim() || undefined,
                      markCompleted: true,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error?.amount?.[0] ?? data.error ?? "Refund failed");
                  setRefundAmount("");
                  setRefundReason("");
                  await fetchOrder();
                  await fetchTimeline();
                  router.refresh();
                } catch (err) {
                  setRefundError(err instanceof Error ? err.message : "Refund failed");
                } finally {
                  setRefundLoading(false);
                }
              }}
            >
              <div>
                <Label htmlFor="refundAmount">Amount (KES)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={String(
                    order.payments
                      .filter((p: Payment) => p.status === "COMPLETED")
                      .reduce((s: number, p: Payment) => s + Number(p.amount), 0)
                  )}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="refundReason">Reason (optional)</Label>
                <Textarea
                  id="refundReason"
                  placeholder="e.g. Customer request, duplicate payment"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
              {refundError && (
                <p className="text-sm text-destructive">{refundError}</p>
              )}
              <Button type="submit" variant="secondary" disabled={refundLoading}>
                {refundLoading ? "Processing…" : "Issue refund and notify customer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle>Items ordered</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items.map((item) => {
                const unitPrice = Number(item.unitPrice);
                const totalItem = unitPrice * item.quantity;
                const imageUrl =
                  (item.productVariant as { image?: string } | null)?.image ??
                  item.product?.images?.[0];
                const productName = item.product?.name ?? "Custom";
                const variant = item.productVariant?.attributes
                  ? Object.entries(item.productVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(" · ")
                  : item.productVariant?.name;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3 border-b last:border-0"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {imageUrl ? (
                        <Image src={String(imageUrl)} alt="" width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300 m-auto block mt-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{productName}</p>
                      {variant && (
                        <p className="text-sm text-gray-500">{variant}</p>
                      )}
                      {(item.product?.sku ?? item.productVariant?.sku) && (
                        <p className="text-xs font-mono text-gray-400">
                          SKU: {item.product?.sku ?? item.productVariant?.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-500">
                        {formatPrice(unitPrice)} × {item.quantity}
                      </p>
                      <p className="font-semibold text-gray-900">{formatPrice(totalItem)}</p>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalKes)}</span>
                </div>
                {discountKes > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>−{formatPrice(discountKes)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping ({addr?.deliveryMethod ?? "—"})</span>
                  <span>{formatPrice(shippingKes)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>VAT (16%, included)</span>
                  <span>{formatPrice(taxKes)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(totalKes)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          {addr && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery</CardTitle>
                {order.delivery && (
                  <Badge variant="secondary" className="ml-2">{order.delivery.status}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{addr.fullName}</p>
                    <p className="text-gray-600">{addr.street}</p>
                    <p className="text-gray-600">
                      {addr.city}, {addr.county}
                    </p>
                    {order.notes && (
                      <p className="text-gray-500 italic mt-1">Note: {order.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {addr.deliveryMethod === "Standard"
                      ? "Standard Delivery"
                      : addr.deliveryMethod === "Express"
                        ? "Express Delivery"
                        : addr.deliveryMethod ?? "Pickup"}
                    {order.estimatedDelivery &&
                      ` · Est. ${formatDate(order.estimatedDelivery)}`}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div className="flex gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-sm">{order.trackingNumber}</span>
                  </div>
                )}
                {order.delivery?.failureReason && (
                  <p className="text-amber-700 text-xs">Failed: {order.delivery.failureReason}</p>
                )}
                {order.delivery && ["PENDING", "DISPATCHED", "IN_TRANSIT"].includes(order.delivery.status) && (
                  <div className="pt-4 border-t space-y-3">
                    {order.delivery.status === "PENDING" && (
                      <>
                        <div className="flex gap-2 flex-wrap items-center">
                          <Input
                            placeholder="Tracking number"
                            value={deliveryTracking}
                            onChange={(e) => setDeliveryTracking(e.target.value)}
                            className="max-w-[200px] h-8 text-sm"
                          />
                          <select
                            value={deliveryCourierId}
                            onChange={(e) => setDeliveryCourierId(e.target.value)}
                            className="border rounded px-2 py-1.5 text-sm h-8 max-w-[180px]"
                          >
                            <option value="">Select courier</option>
                            {couriers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            disabled={deliveryUpdateLoading}
                            onClick={async () => {
                              setDeliveryUpdateLoading(true);
                              try {
                                const res = await fetch(`/api/admin/deliveries/${order.delivery!.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    status: "DISPATCHED",
                                    trackingNumber: deliveryTracking.trim() || undefined,
                                    assignedCourierId: deliveryCourierId || null,
                                  }),
                                });
                                if (!res.ok) throw new Error("Failed");
                                setDeliveryTracking("");
                                setDeliveryCourierId("");
                                await fetchOrder();
                                fetchTimeline();
                                router.refresh();
                              } catch {
                                alert("Failed to mark dispatched");
                              }
                              setDeliveryUpdateLoading(false);
                            }}
                          >
                            Mark Dispatched
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Failure reason (if failed)"
                            value={deliveryFailureReason}
                            onChange={(e) => setDeliveryFailureReason(e.target.value)}
                            className="max-w-[220px] h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deliveryUpdateLoading}
                            onClick={async () => {
                              setDeliveryUpdateLoading(true);
                              try {
                                const res = await fetch(`/api/admin/deliveries/${order.delivery!.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    status: "FAILED",
                                    failureReason: deliveryFailureReason.trim() || undefined,
                                  }),
                                });
                                if (!res.ok) throw new Error("Failed");
                                setDeliveryFailureReason("");
                                await fetchOrder();
                                fetchTimeline();
                                router.refresh();
                              } catch {
                                alert("Failed to mark failed");
                              }
                              setDeliveryUpdateLoading(false);
                            }}
                          >
                            Mark Failed
                          </Button>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                          <input
                            type="date"
                            value={deliveryRescheduleTo}
                            onChange={(e) => setDeliveryRescheduleTo(e.target.value)}
                            className="border rounded px-2 py-1.5 text-sm h-8"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deliveryUpdateLoading || !deliveryRescheduleTo}
                            onClick={async () => {
                              setDeliveryUpdateLoading(true);
                              try {
                                const res = await fetch(`/api/admin/deliveries/${order.delivery!.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    rescheduledTo: new Date(deliveryRescheduleTo).toISOString(),
                                  }),
                                });
                                if (!res.ok) throw new Error("Failed");
                                setDeliveryRescheduleTo("");
                                await fetchOrder();
                                router.refresh();
                              } catch {
                                alert("Failed to reschedule");
                              }
                              setDeliveryUpdateLoading(false);
                            }}
                          >
                            Reschedule
                          </Button>
                        </div>
                      </>
                    )}
                    {(order.delivery.status === "DISPATCHED" || order.delivery.status === "IN_TRANSIT") && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={deliveryUpdateLoading}
                          onClick={async () => {
                            setDeliveryUpdateLoading(true);
                            try {
                              const res = await fetch(`/api/admin/deliveries/${order.delivery!.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "DELIVERED" }),
                              });
                              if (!res.ok) throw new Error("Failed");
                              await fetchOrder();
                              fetchTimeline();
                              router.refresh();
                            } catch {
                              alert("Failed to mark delivered");
                            }
                            setDeliveryUpdateLoading(false);
                          }}
                        >
                          Mark Delivered
                        </Button>
                        <Input
                          placeholder="Failure reason"
                          value={deliveryFailureReason}
                          onChange={(e) => setDeliveryFailureReason(e.target.value)}
                          className="max-w-[180px] h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deliveryUpdateLoading}
                          onClick={async () => {
                            setDeliveryUpdateLoading(true);
                            try {
                              const res = await fetch(`/api/admin/deliveries/${order.delivery!.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  status: "FAILED",
                                  failureReason: deliveryFailureReason.trim() || undefined,
                                }),
                              });
                              if (!res.ok) throw new Error("Failed");
                              setDeliveryFailureReason("");
                              await fetchOrder();
                              fetchTimeline();
                              router.refresh();
                            } catch {
                              alert("Failed to mark failed");
                            }
                            setDeliveryUpdateLoading(false);
                          }}
                        >
                          Mark Failed
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                        event.type === "error"
                          ? "bg-red-100"
                          : event.type === "success"
                            ? "bg-green-100"
                            : event.type === "action"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                      }`}
                    >
                      {event.type === "error" && <XCircle className="w-3 h-3 text-red-500" />}
                      {event.type === "success" && <CheckCircle className="w-3 h-3 text-green-500" />}
                      {event.type === "action" && <Activity className="w-3 h-3 text-blue-500" />}
                      {event.type === "info" && <ShoppingCart className="w-3 h-3 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{event.label}</p>
                      {event.detail && (
                        <p className="text-xs text-gray-500">{event.detail}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelativeDate(event.timestamp)}
                        {event.actor && ` · ${event.actor}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Customer
                {order.userId ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/customers/${order.userId}`}>View profile →</Link>
                  </Button>
                ) : (
                  <Badge variant="secondary">Guest</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium">{deliveryName}</p>
                  <p className="text-sm text-gray-500">{guestEmail || "—"}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {guestPhone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{guestPhone}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => window.open(`tel:${guestPhone}`)}
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          window.open(
                            `https://wa.me/${guestPhone.replace(/\D/g, "").replace(/^0/, "254")}`
                          )
                        }
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {guestEmail && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{guestEmail}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => window.open(`mailto:${guestEmail}`)}
                    >
                      <Mail className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${guestPhone?.replace(/\D/g, "").replace(/^0/, "254")}?text=${encodeURIComponent(
                        `Hi, this is PrintHub regarding your order ${order.orderNumber}. Your payment of ${formatPrice(totalKes)} was not completed. Would you like to retry?`
                      )}`
                    )
                  }
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => alert("Email reminder not implemented yet.")}>
                  <Mail className="w-3 h-3 mr-1" />
                  Email reminder
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium">
                  {latestPayment?.provider === "MPESA"
                    ? "M-Pesa"
                    : latestPayment?.provider === "STRIPE"
                      ? "Card"
                      : latestPayment?.provider ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <PaymentStatusBadge status={paymentStatus} />
              </div>
              {mpesaTransaction && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phone used</span>
                    <span className="font-mono">{mpesaTransaction.phoneNumber}</span>
                  </div>
                  {mpesaTransaction.mpesaReceiptNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">M-Pesa receipt</span>
                      <span className="font-mono text-green-600">
                        {mpesaTransaction.mpesaReceiptNumber}
                      </span>
                    </div>
                  )}
                  {mpesaTransaction.resultDesc && (
                    <div className="bg-red-50 rounded p-2 text-xs text-red-600">
                      {mpesaTransaction.resultDesc}
                    </div>
                  )}
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount due</span>
                <span className="font-bold">{formatPrice(totalKes)}</span>
              </div>
              {order.paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Paid at</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {paymentStatus === "FAILED" && (
                <div className="space-y-2 pb-3 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Payment Recovery
                  </p>
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    onClick={resendStk}
                    disabled={resendStkLoading}
                  >
                    Resend M-Pesa Prompt
                    {mpesaTransaction?.phoneNumber && (
                      <span className="text-xs text-gray-400 ml-1">to {mpesaTransaction.phoneNumber}</span>
                    )}
                  </Button>
                  <Button className="w-full" size="sm" variant="outline" onClick={copyPaymentLink}>
                    Copy Payment Link
                  </Button>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    onClick={() => {
                      setManualAmount(String(totalKes));
                      setManualPaymentModalOpen(true);
                    }}
                  >
                    Mark as Manually Paid
                  </Button>
                  <Button
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Order
                  </Button>
                </div>
              )}

              {paymentStatus === "COMPLETED" && (
                <div className="space-y-2 pb-3 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Order Status
                  </p>
                  {order.status === "CONFIRMED" && (
                    <Button
                      className="w-full bg-blue-600 text-white"
                      size="sm"
                      onClick={() => updateStatus("PROCESSING")}
                    >
                      Start Processing
                    </Button>
                  )}
                  {order.status === "PROCESSING" && (
                    <Button
                      className="w-full bg-purple-600 text-white"
                      size="sm"
                      onClick={() => updateStatus("PRINTING")}
                    >
                      Mark as Printing
                    </Button>
                  )}
                  {order.status === "PRINTING" && (
                    <Button
                      className="w-full bg-indigo-600 text-white"
                      size="sm"
                      onClick={() => updateStatus("QUALITY_CHECK")}
                    >
                      Mark as Quality Check
                    </Button>
                  )}
                  {order.status === "QUALITY_CHECK" && (
                    <Button
                      className="w-full bg-orange-600 text-white"
                      size="sm"
                      onClick={() => setShipModalOpen(true)}
                    >
                      Mark as Shipped
                    </Button>
                  )}
                  {order.status === "SHIPPED" && (
                    <Button
                      className="w-full bg-green-600 text-white"
                      size="sm"
                      onClick={() => updateStatus("DELIVERED")}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">General</p>
                <Button className="w-full" size="sm" variant="outline" onClick={printInvoice}>
                  Print Invoice / Receipt
                </Button>
                <Button className="w-full" size="sm" variant="outline" onClick={addNote}>
                  Add Internal Note
                </Button>
                {(order.status === "CONFIRMED" || order.status === "PENDING") &&
                  paymentStatus !== "FAILED" && (
                    <Button
                      className="w-full text-red-600 border-red-200"
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelModalOpen(true)}
                    >
                      Cancel Order
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recovery modal (summary of options) */}
      <Dialog open={recoveryModalOpen} onOpenChange={setRecoveryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment recovery options</DialogTitle>
            <DialogDescription>
              Choose how to recover payment for order {order.orderNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button onClick={resendStk} disabled={resendStkLoading}>
              Resend M-Pesa Prompt
            </Button>
            <Button variant="outline" onClick={copyPaymentLink}>
              Copy Payment Link
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setManualAmount(String(totalKes));
                setRecoveryModalOpen(false);
                setManualPaymentModalOpen(true);
              }}
            >
              Mark as Manually Paid
            </Button>
            <Button variant="outline" className="text-red-600" onClick={() => setCancelModalOpen(true)}>
              Cancel Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual payment modal */}
      <Dialog open={manualPaymentModalOpen} onOpenChange={setManualPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Manually Paid</DialogTitle>
            <DialogDescription>
              Use this when payment was received outside the system — e.g. cash, bank transfer, or
              M-Pesa was confirmed verbally but the callback failed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <Label className="text-sm font-medium">Payment method *</Label>
              <select
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">How was payment received?</option>
                {MANUAL_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Reference / Receipt number</Label>
              <Input
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="e.g. QHK3X2ZA9P (M-Pesa code) or TRX-001234"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Amount received (KSh) *</Label>
              <Input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
              {manualAmount &&
                Number(manualAmount) !== totalKes && (
                  <p className="text-xs text-amber-600 mt-1">
                    Amount differs from order total ({formatPrice(totalKes)})
                  </p>
                )}
            </div>
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Any additional notes about this payment..."
                rows={2}
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              This action is logged in the audit trail. Ensure payment has actually been received
              before confirming.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!manualMethod || !manualAmount}
              onClick={confirmManualPayment}
            >
              Confirm Payment Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel order modal */}
      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order {order.orderNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and notify the customer by email.
              {paymentStatus === "COMPLETED" &&
                " Since payment was received, you will need to issue a refund separately."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label className="text-sm font-medium">Reason for cancellation</Label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select reason...</option>
              {CANCEL_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason}
              onClick={() => cancelOrder(cancelReason)}
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ship modal */}
      <Dialog open={shipModalOpen} onOpenChange={setShipModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div>
              <Label className="text-sm font-medium">Carrier</Label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CARRIERS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Tracking number</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Optional but recommended"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-600 text-white" onClick={markShipped}>
              Mark as Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
