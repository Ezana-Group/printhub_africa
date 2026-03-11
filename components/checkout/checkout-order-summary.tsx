"use client";

import { useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { calculateCartTotals } from "@/lib/cart-calculations";
import { cn } from "@/lib/utils";

interface CheckoutOrderSummaryProps {
  shippingFee: number;
  paymentMethod?: string;
  className?: string;
}

export function CheckoutOrderSummary({
  shippingFee,
  paymentMethod,
  className,
}: CheckoutOrderSummaryProps) {
  const { items, appliedCoupon, setAppliedCoupon } = useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const totals = calculateCartTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    shippingFee,
    appliedCoupon?.discountAmount ?? 0
  );

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: totals.subtotalInclVat }),
      });
      const data = await res.json();
      if (data.valid && data.discount != null) {
        setAppliedCoupon({ code: data.code, discountAmount: data.discount });
        setCouponInput("");
      } else {
        setCouponError(data.error ?? "This coupon is invalid or expired.");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Mobile: collapsible header */}
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 lg:hidden text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="font-semibold">
          Order summary ({formatPrice(totals.total)})
        </span>
        <span className="text-muted-foreground" aria-hidden>
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      <div
        className={cn(
          "p-4 lg:p-6 border-t border-border lg:border-t",
          !expanded && "max-lg:hidden"
        )}
      >
        <h2 className="font-semibold text-lg hidden lg:block mb-4">Order summary</h2>

        <ul className="space-y-3 mb-4">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.variantId ?? ""}`}
              className="flex gap-3"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  × {item.quantity}
                </p>
              </div>
              <div className="text-sm font-medium shrink-0">
                {formatPrice(item.unitPrice * item.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-2 mb-4">
          <label className="text-sm text-muted-foreground">Coupon code</label>
          {appliedCoupon ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-3 py-2">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                ✓ {appliedCoupon.code} applied — {formatPrice(appliedCoupon.discountAmount)} off
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-green-700 hover:text-green-900 h-8"
                onClick={() => setAppliedCoupon(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="e.g. WELCOME10"
                className="rounded-lg bg-background"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
              >
                {couponLoading ? "Checking…" : "Apply"}
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-destructive">{couponError}</p>
          )}
        </div>

        <dl className="space-y-2 text-sm border-t border-border pt-4">
          <div className="flex justify-between text-muted-foreground">
            <dt>Subtotal</dt>
            <dd>{formatPrice(totals.subtotalInclVat)}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Shipping</dt>
            <dd>{shippingFee > 0 ? formatPrice(shippingFee) : "Calculated"}</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>VAT (16%, included)</dt>
            <dd>{formatPrice(totals.vatAmount)}</dd>
          </div>
          {totals.discountKes > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <dt>Discount</dt>
              <dd>−{formatPrice(totals.discountKes)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
            <dt>Total</dt>
            <dd>{formatPrice(totals.total)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground mt-2">{totals.vatNote}</p>
        {paymentMethod && (
          <p className="text-xs text-muted-foreground mt-1">
            Payment method: {paymentMethod}
          </p>
        )}
      </div>
    </div>
  );
}
