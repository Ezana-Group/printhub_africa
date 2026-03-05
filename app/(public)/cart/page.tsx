"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { VAT_RATE } from "@/lib/constants";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart, appliedCoupon, setAppliedCoupon } = useCartStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = total();
  const discount = appliedCoupon?.discountAmount ?? 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const vat = subtotalAfterDiscount * VAT_RATE;
  const totalWithVat = subtotalAfterDiscount + vat;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.valid && data.discount != null) {
        setAppliedCoupon({ code: data.code, discountAmount: data.discount });
        setCouponInput("");
      } else {
        setCouponError(data.error ?? "This coupon could not be applied.");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  if (items.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <h1 className="font-display text-3xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="text-slate-600 mt-2">Add products from the shop to continue.</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">Shopping cart</h1>
      <p className="text-slate-600 mt-1">{items.length} item(s)</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId ?? ""}`}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No image</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/shop/${item.slug}`} className="font-semibold text-slate-900 hover:underline">
                  {item.name}
                </Link>
                <p className="text-sm text-slate-600 mt-0.5">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label="Increase"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="ml-2 text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-semibold text-slate-900">
                {formatPrice(item.unitPrice * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 h-fit">
          <h2 className="font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4">
            <label className="text-sm text-slate-600">Coupon code</label>
            {appliedCoupon ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                <span className="text-sm font-medium text-green-800">
                  {appliedCoupon.code} applied (−{formatPrice(appliedCoupon.discountAmount)})
                </span>
                <Button type="button" variant="ghost" size="sm" className="text-green-700 hover:text-green-900" onClick={handleRemoveCoupon}>
                  Remove
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="e.g. WELCOME10"
                  className="rounded-xl bg-white"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl shrink-0"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? "Checking…" : "Apply"}
                </Button>
              </div>
            )}
            {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <dt>Discount ({appliedCoupon?.code})</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <dt>VAT (16%)</dt>
              <dd>{formatPrice(vat)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd>{formatPrice(totalWithVat)}</dd>
            </div>
          </dl>
          <Button asChild className="mt-6 w-full rounded-xl bg-primary hover:bg-primary/90">
            <Link href="/checkout">Proceed to checkout</Link>
          </Button>
          <Button variant="ghost" className="mt-2 w-full rounded-xl" onClick={clearCart}>
            Clear cart
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/shop" className="text-primary font-medium hover:underline">← Continue shopping</Link>
      </div>
    </div>
  );
}
