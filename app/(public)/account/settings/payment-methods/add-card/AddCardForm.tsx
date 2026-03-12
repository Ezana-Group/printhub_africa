"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function AddCardForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setLoading(true);
    setError(null);

    try {
      const { setupIntent, error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (confirmError) {
        setError(confirmError.message ?? "Card could not be verified.");
        setLoading(false);
        return;
      }

      const paymentMethodId = typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : (setupIntent?.payment_method as { id?: string } | undefined)?.id;
      if (!paymentMethodId) {
        setError("Could not get payment method.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/account/payment-methods/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save card.");
        setLoading(false);
        return;
      }

      router.push("/account/settings/payment-methods");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-input bg-background p-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#1f2937", "::placeholder": { color: "#9ca3af" } },
              invalid: { color: "#dc2626" },
            },
          }
        }
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/account/settings/payment-methods")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save card"
          )}
        </Button>
      </div>
    </form>
  );
}
