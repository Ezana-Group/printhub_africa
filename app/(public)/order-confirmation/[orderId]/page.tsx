"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface ConfirmationOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  items: { id: string; productName: string; quantity: number; unitPrice: number; total: number }[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    county: string;
    deliveryMethod?: string;
  } | null;
}

const PESAPAL_POLL_INTERVAL_MS = 4000;
const PESAPAL_POLL_MAX_ATTEMPTS = 20;

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const isPesaPalReturn = searchParams?.get("pesapal") === "1";
  const { data: session, status: sessionStatus } = useSession();
  const [order, setOrder] = useState<ConfirmationOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyDone, setCopyDone] = useState(false);
  const [pesapalState, setPesapalState] = useState<"confirming" | "confirmed" | "failed" | null>(
    isPesaPalReturn ? "confirming" : null
  );
  const pollAttempts = useRef(0);
  const pesapalOrderTrackingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}/confirmation`)
      .then((r) => r.json())
      .then((data) => {
        if (data.orderNumber) setOrder(data);
        if (data.status === "CONFIRMED") setPesapalState("confirmed");
        if (data.pesapalOrderTrackingId) pesapalOrderTrackingIdRef.current = data.pesapalOrderTrackingId;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !isPesaPalReturn || pesapalState !== "confirming" || !order) return;
    const orderTrackingId =
      searchParams?.get("OrderTrackingId") ??
      searchParams?.get("orderTrackingId") ??
      pesapalOrderTrackingIdRef.current;
    if (!orderTrackingId) return;
    const interval = setInterval(async () => {
      pollAttempts.current += 1;
      if (pollAttempts.current > PESAPAL_POLL_MAX_ATTEMPTS) {
        setPesapalState("failed");
        clearInterval(interval);
        return;
      }
      try {
        const r = await fetch(
          `/api/payments/pesapal/status?orderTrackingId=${encodeURIComponent(orderTrackingId)}&orderId=${encodeURIComponent(orderId)}`
        );
        const data = await r.json();
        if (data.status === "CONFIRMED") {
          setPesapalState("confirmed");
          setOrder((prev) => (prev ? { ...prev, status: "CONFIRMED" } : null));
          clearInterval(interval);
        } else if (data.status === "FAILED") {
          setPesapalState("failed");
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    }, PESAPAL_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orderId, isPesaPalReturn, pesapalState, order, searchParams]);

  const copyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  };

  if (loading || !order) {
    return (
      <div className="min-h-[50vh] bg-[#F9FAFB] flex items-center justify-center">
        <p className="text-muted-foreground">{loading ? "Loading…" : "Order not found."}</p>
      </div>
    );
  }

  if (pesapalState === "confirming") {
    return (
      <div className="min-h-[50vh] bg-[#F9FAFB] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  if (pesapalState === "failed") {
    return (
      <div className="min-h-[50vh] bg-[#F9FAFB] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">
          We couldn’t confirm your payment yet. You can try again or contact support.
        </p>
        <Button asChild>
          <Link href={`/pay/${orderId}`}>Try again</Link>
        </Button>
      </div>
    );
  }

  const firstName = order.shippingAddress?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div
            className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-4"
            aria-hidden
          >
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Order confirmed!
          </h1>
          <p className="text-muted-foreground mt-1">
            Thank you, {firstName}.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-muted-foreground">Order number</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{order.orderNumber}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={copyOrderNumber}
                className="shrink-0"
              >
                {copyDone ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            We&apos;ve sent a confirmation to {order.shippingAddress?.email ?? "your email"}.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="font-semibold text-sm text-muted-foreground mb-3">
            What happens next
          </h2>
          <ol className="space-y-2 text-sm">
            <li>1. Confirmation email sent to you</li>
            <li>2. Our team reviews your order (same business day)</li>
            <li>3. Order prepared & dispatched</li>
            <li>4. Delivery in 3–5 business days</li>
          </ol>
        </div>

        <div className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="font-semibold mb-4">Your order</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(item.total)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t mt-4 pt-4 space-y-1 text-sm">
            {order.shippingAddress?.deliveryMethod && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping ({order.shippingAddress.deliveryMethod})</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2">
              <span>Total paid</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          {order.shippingAddress && (
            <p className="text-sm text-muted-foreground mt-4">
              Delivering to: {order.shippingAddress.fullName},{" "}
              {order.shippingAddress.street}, {order.shippingAddress.county}.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {session && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href={`/account/orders/${order.id}`}>Track your order</Link>
            </Button>
          )}
          <Button variant={session ? "outline" : "default"} className={!session ? "bg-primary hover:bg-primary/90" : ""} asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>

        {sessionStatus !== "loading" && !session && (
          <div className="mt-10 rounded-xl border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Create an account to track your order, save addresses, and get member offers.
            </p>
            <Button variant="secondary" asChild>
              <Link href={`/auth/register?email=${encodeURIComponent(order.shippingAddress?.email ?? "")}`}>
                Create account
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
