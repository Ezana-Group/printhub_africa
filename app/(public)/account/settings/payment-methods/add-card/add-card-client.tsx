"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { AddCardForm } from "./AddCardForm";
import { Loader2, CreditCard, ShoppingCart } from "lucide-react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function AddCardClient() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stripePromise) {
      setError("PESAPAL"); // special value: show PesaPal message, not error
      setLoading(false);
      return;
    }
    fetch("/api/account/payment-methods/cards/setup-intent", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Could not start add-card session.");
        }
      })
      .catch(() => setError("Failed to load form."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // PesaPal-only (no Stripe): card payments at checkout via PesaPal redirect
  if (error === "PESAPAL") {
    return (
      <div className="space-y-6 max-w-md">
        <div className="rounded-2xl border border-border bg-muted/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Pay with card via PesaPal</h2>
              <p className="text-sm text-muted-foreground">Visa &amp; Mastercard accepted</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            We use <strong>PesaPal</strong> for card payments in Kenya. Your card number is never stored on our servers.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            To pay with a card, go to <strong>checkout</strong> and choose <strong>Card</strong>. You&apos;ll be redirected to PesaPal&apos;s secure page to enter your card details.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <ShoppingCart className="h-4 w-4" />
              Continue shopping
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              View cart
            </Link>
          </div>
        </div>
        <Link
          href="/account/settings/payment-methods"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Payment Methods
        </Link>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="space-y-4 max-w-md">
        <p className="text-sm text-muted-foreground">{error ?? "Something went wrong."}</p>
        <Link
          href="/account/settings/payment-methods"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Payment Methods
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-muted-foreground">
        Add a card to use at checkout. Your card number is never stored on our servers.
      </p>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "hsl(var(--primary))" },
          },
        }}
      >
        <AddCardForm clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}
