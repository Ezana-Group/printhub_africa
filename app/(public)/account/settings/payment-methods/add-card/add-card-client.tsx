"use client";

import Link from "next/link";
import { CreditCard, ShoppingCart } from "lucide-react";

/**
 * Card payments use PesaPal at checkout. No saved cards / Stripe.
 */
export function AddCardClient() {
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
          To pay with a card, go to <strong>checkout</strong> and choose <strong>PesaPal</strong>. You&apos;ll be redirected to PesaPal&apos;s secure page to enter your card details.
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
