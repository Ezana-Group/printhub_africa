"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { AddCardForm } from "./AddCardForm";
import { Loader2 } from "lucide-react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function AddCardClient() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stripePromise) {
      setError("Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable saving cards.");
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
