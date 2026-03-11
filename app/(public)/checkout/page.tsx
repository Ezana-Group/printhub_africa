"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCartStore, isCatalogueCartItem } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { calculateCartTotals } from "@/lib/cart-calculations";
import { KENYA_COUNTIES_CHECKOUT } from "@/lib/constants";
import { StepIndicator } from "@/components/checkout/step-indicator";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { Select } from "@/components/ui/select";

const PHONE_REGEX = /^\+?254[17]\d{8}$/;

function normalizePhone(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return val;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, appliedCoupon } = useCartStore();
  const {
    step,
    setStep,
    contact,
    setContact,
    delivery,
    setDelivery,
    payment,
    setPayment,
    setOrderId,
    reset: resetCheckout,
  } = useCheckoutStore();

  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<{
    mpesa: boolean;
    stripe: boolean;
    pesapal: boolean;
    flutterwave: boolean;
  }>({ mpesa: true, stripe: false, pesapal: false, flutterwave: false });
  const [shippingRates, setShippingRates] = useState<{
    standard: number;
    express: number | null;
    pickup: number;
  }>({ standard: 300, express: 600, pickup: 0 });
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);

  const shippingFee =
    delivery.method === "PICKUP"
      ? 0
      : delivery.method === "EXPRESS"
        ? shippingRates.express ?? shippingRates.standard
        : delivery.fee ?? shippingRates.standard;

  const totals = calculateCartTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    shippingFee,
    appliedCoupon?.discountAmount ?? 0
  );

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items.length, router]);

  useEffect(() => {
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then(setPaymentMethods)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!delivery.county) return;
    fetch(`/api/shipping/fee?county=${encodeURIComponent(delivery.county)}`)
      .then((r) => r.json())
      .then((data) =>
        setShippingRates({
          standard: data.standard ?? 300,
          express: data.express ?? null,
          pickup: data.pickup ?? 0,
        })
      )
      .catch(() => {});
  }, [delivery.county]);

  // Sync delivery fee when method or shipping rates change
  useEffect(() => {
    const fee =
      delivery.method === "PICKUP"
        ? 0
        : delivery.method === "EXPRESS"
          ? shippingRates.express ?? shippingRates.standard
          : shippingRates.standard;
    setDelivery({ fee });
  }, [delivery.method, shippingRates.standard, shippingRates.express, setDelivery]);

  const canContinueStep1 =
    contact.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    (contact.firstName ?? "").trim().length >= 2 &&
    (contact.lastName ?? "").trim().length >= 2 &&
    PHONE_REGEX.test(normalizePhone(contact.phone ?? "")) &&
    (!createAccount || (password && password.length >= 8));

  const canContinueStep2 =
    (delivery.street ?? "").trim() &&
    (delivery.area ?? "").trim() &&
    (delivery.county ?? "").trim() &&
    (delivery.city ?? "").trim();

  const handleCreateOrder = async () => {
    setPlacingOrder(true);
    setError("");
    setPaymentFailed(false);
    setPaymentTimedOut(false);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) =>
            isCatalogueCartItem(i)
              ? {
                  catalogueItemId: i.catalogueItemId,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  customizations: {
                    materialCode: i.materialCode,
                    materialName: i.materialName,
                    colourHex: i.colourHex,
                    colourName: i.colourName,
                  },
                }
              : {
                  productId: i.productId,
                  variantId: i.variantId ?? undefined,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                }
          ),
          shippingAddress: {
            fullName: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim(),
            email: contact.email,
            phone: normalizePhone(contact.phone ?? ""),
            street: delivery.street,
            city: delivery.city ?? "Nairobi",
            county: delivery.county,
            postalCode: delivery.postalCode || undefined,
            deliveryMethod:
              delivery.method === "STANDARD"
                ? "Standard"
                : delivery.method === "EXPRESS"
                  ? "Express"
                  : "Pickup",
          },
          shippingCost: shippingFee,
          discount: appliedCoupon?.discountAmount ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setOrderId(data.order.id);
      setPlacedOrderId(data.order.id);
      setPlacedOrderNumber(data.order.orderNumber);
      // If M-Pesa, trigger STK and show waiting
      if (payment.method === "MPESA") {
        const phone = (payment.mpesaPhone || contact.phone || "").trim();
        const mpesaPhone = normalizePhone(phone);
        const stkRes = await fetch("/api/payments/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.order.id,
            phone: mpesaPhone,
          }),
        });
        const stkData = await stkRes.json();
        if (!stkRes.ok) {
          setError(stkData.error ?? "M-Pesa request failed");
          setPlacingOrder(false);
          return;
        }
        setWaitingForPayment(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Poll payment status when waiting for M-Pesa
  useEffect(() => {
    if (!waitingForPayment || !placedOrderId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${placedOrderId}/payment-status`);
      const { status } = await res.json();
      if (status === "CONFIRMED") {
        clearInterval(interval);
        setWaitingForPayment(false);
        useCartStore.getState().clearCart();
        resetCheckout();
        router.push(`/order-confirmation/${placedOrderId}`);
      } else if (status === "PAYMENT_FAILED") {
        clearInterval(interval);
        setWaitingForPayment(false);
        setPaymentFailed(true);
      }
    }, 3000);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setWaitingForPayment(false);
      setPaymentTimedOut(true);
    }, 90000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [waitingForPayment, placedOrderId, router, resetCheckout]);

  const handleResendMpesa = async () => {
    if (!placedOrderId || !contact.phone) return;
    setError("");
    const res = await fetch("/api/payments/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: placedOrderId,
        phone: normalizePhone(contact.phone),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Resend failed");
    else setWaitingForPayment(true);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // M-Pesa waiting screen
  if (waitingForPayment && placedOrderId) {
    return (
      <div className="min-h-[60vh] bg-[#F9FAFB] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-5xl">📱</div>
            <h2 className="text-xl font-semibold">Check your phone!</h2>
            <p className="text-muted-foreground">
              We&apos;ve sent a payment request to {contact.phone}. Enter your M-Pesa PIN to complete payment.
            </p>
            <p className="font-medium">{formatPrice(totals.total)} · {placedOrderNumber}</p>
            <p className="text-sm text-muted-foreground animate-pulse">Waiting for payment…</p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleResendMpesa}>
                I didn&apos;t receive the prompt — Resend
              </Button>
              <Button variant="ghost" onClick={() => setWaitingForPayment(false)}>
                Cancel payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment failed / timed out
  if (paymentFailed || paymentTimedOut) {
    return (
      <div className="min-h-[50vh] bg-[#F9FAFB] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-medium">
              {paymentTimedOut ? "Payment timed out." : "Payment failed."}
            </p>
            <p className="text-sm text-muted-foreground">
              {paymentTimedOut
                ? "You can try again or choose a different payment method."
                : "Please check your M-Pesa and try again."}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={() => { setPaymentFailed(false); setPaymentTimedOut(false); setStep(3); }}>
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/cart">Back to cart</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Checkout</h1>
        <div className="mb-8">
          <StepIndicator currentStep={step} />
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          <div className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Step 1 — Contact */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Contact information</h2>
                  {session?.user && (
                    <p className="text-sm text-muted-foreground">
                      Logged in as {session.user.email}. <Link href="/account" className="text-primary underline">Change</Link>
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email address *</Label>
                    <Input
                      type="email"
                      value={contact.email ?? ""}
                      onChange={(e) => setContact({ email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">We&apos;ll send your order confirmation here</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First name *</Label>
                      <Input
                        value={contact.firstName ?? ""}
                        onChange={(e) => setContact({ firstName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Last name *</Label>
                      <Input
                        value={contact.lastName ?? ""}
                        onChange={(e) => setContact({ lastName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Phone number *</Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      value={contact.phone ?? ""}
                      onChange={(e) => setContact({ phone: e.target.value })}
                      placeholder="+254 7XX XXX XXX"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Used for M-Pesa and delivery updates</p>
                  </div>
                  {!session?.user && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="create-account"
                          checked={createAccount}
                          onChange={(e) => setCreateAccount(e.target.checked)}
                          className="rounded border-input"
                        />
                        <Label htmlFor="create-account">Create an account to track your order</Label>
                      </div>
                      {createAccount && (
                        <div>
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </>
                  )}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => setStep(2)}
                    disabled={!canContinueStep1}
                  >
                    Continue to Delivery →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2 — Delivery */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Delivery</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Street address / Estate / Building *</Label>
                    <Input
                      value={delivery.street ?? ""}
                      onChange={(e) => setDelivery({ street: e.target.value })}
                      placeholder="e.g. Kilimani Road, Valley Arcade"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Sub-county / Area *</Label>
                    <Input
                      value={delivery.area ?? ""}
                      onChange={(e) => setDelivery({ area: e.target.value })}
                      placeholder="e.g. Kilimani"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>County *</Label>
                    <Select
                      className="mt-1"
                      value={delivery.county ?? ""}
                      onChange={(e) => setDelivery({ county: e.target.value })}
                      options={KENYA_COUNTIES_CHECKOUT.map((c) => ({ value: c, label: c }))}
                      placeholder="Select county"
                    />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={delivery.city ?? "Nairobi"}
                      onChange={(e) => setDelivery({ city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Postal code (optional)</Label>
                    <Input
                      inputMode="numeric"
                      value={delivery.postalCode ?? ""}
                      onChange={(e) => setDelivery({ postalCode: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Delivery notes (optional)</Label>
                    <Input
                      value={delivery.notes ?? ""}
                      onChange={(e) => setDelivery({ notes: e.target.value })}
                      placeholder='e.g. "Green gate, call on arrival"'
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="block mb-2">Delivery method</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={delivery.method === "STANDARD"}
                          onChange={() => setDelivery({ method: "STANDARD", fee: shippingRates.standard })}
                        />
                        <span>Standard Delivery — {formatPrice(shippingRates.standard)} — 3–5 business days</span>
                      </label>
                      {(shippingRates.express ?? 0) > 0 && (
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={delivery.method === "EXPRESS"}
                            onChange={() => setDelivery({ method: "EXPRESS", fee: shippingRates.express ?? shippingRates.standard })}
                          />
                          <span>Express — {formatPrice(shippingRates.express ?? 0)} — 1–2 business days</span>
                        </label>
                      )}
                      <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={delivery.method === "PICKUP"}
                          onChange={() => setDelivery({ method: "PICKUP", fee: 0 })}
                        />
                        <span>Pick up — Nairobi — FREE</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      ← Back
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => setStep(3)}
                      disabled={!canContinueStep2}
                    >
                      Continue to Payment →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3 — Payment */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Payment</h2>
                  <p className="text-sm text-muted-foreground">Choose your payment method</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.mpesa && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "MPESA"}
                        onChange={() => setPayment({ method: "MPESA" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">M-Pesa</span>
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">RECOMMENDED</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Lipa Na M-Pesa STK Push — instant, secure</p>
                      </div>
                    </label>
                  )}
                  {paymentMethods.stripe && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "STRIPE"}
                        onChange={() => setPayment({ method: "STRIPE" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">Card (Visa / Mastercard)</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Powered by Stripe</p>
                      </div>
                    </label>
                  )}
                  {paymentMethods.pesapal && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "PESAPAL"}
                        onChange={() => setPayment({ method: "PESAPAL" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">Pesapal</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Card, bank transfer, mobile money</p>
                      </div>
                    </label>
                  )}
                  {paymentMethods.flutterwave && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "FLUTTERWAVE"}
                        onChange={() => setPayment({ method: "FLUTTERWAVE" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">Flutterwave</span>
                        <p className="text-sm text-muted-foreground mt-0.5">M-Pesa, cards, multiple currencies</p>
                      </div>
                    </label>
                  )}
                  {payment.method === "MPESA" && (
                    <div className="pt-2">
                      <Label>M-Pesa phone number</Label>
                      <Input
                        type="tel"
                        inputMode="tel"
                        value={payment.mpesaPhone ?? contact.phone ?? ""}
                        onChange={(e) => setPayment({ mpesaPhone: e.target.value })}
                        placeholder="+254 7XX XXX XXX"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">We&apos;ll send an STK push to this number.</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      ← Back
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => setStep(4)}
                      disabled={payment.method === "MPESA" && !(payment.mpesaPhone || contact.phone)}
                    >
                      Continue to Review →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4 — Review */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Review your order</h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Items</h3>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li
                          key={isCatalogueCartItem(item) ? `cat:${item.catalogueItemId}:${item.materialCode}:${item.colourHex}` : `shop:${item.productId}:${item.variantId ?? ""}`}
                          className="flex justify-between text-sm"
                        >
                          <span>{item.name} × {item.quantity}</span>
                          <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/cart" className="text-sm text-primary hover:underline mt-1 inline-block">
                      Edit items →
                    </Link>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Deliver to</h3>
                    <p className="text-sm">
                      {contact.firstName} {contact.lastName}<br />
                      {delivery.street}, {delivery.area}, {delivery.county}<br />
                      {contact.phone}
                    </p>
                    <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setStep(2)}>
                      Edit →
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Payment</h3>
                    <p className="text-sm">M-Pesa — {payment.mpesaPhone || contact.phone}</p>
                    <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setStep(3)}>
                      Edit →
                    </Button>
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(totals.subtotalInclVat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(shippingFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (16%, included)</span>
                      <span>{formatPrice(totals.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-2">
                      <span>Total</span>
                      <span>{formatPrice(totals.total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="terms">I agree to PrintHub&apos;s Terms of Service and Privacy Policy *</Label>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-base py-6"
                    onClick={handleCreateOrder}
                    disabled={placingOrder || !termsAccepted}
                  >
                    {placingOrder ? "Creating order…" : `Place order — ${formatPrice(totals.total)}`}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    By placing your order you agree to our terms. Your M-Pesa number will receive a payment prompt.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <CheckoutOrderSummary
              shippingFee={shippingFee}
              paymentMethod={step >= 3 ? (payment.method === "MPESA" ? "M-Pesa" : payment.method) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
