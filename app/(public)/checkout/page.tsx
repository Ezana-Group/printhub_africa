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
import { PaymentStep } from "@/components/checkout/PaymentStep";

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
    airtelMoney: boolean;
    tkash: boolean;
    stripe: boolean;
    pesapal: boolean;
    flutterwave: boolean;
    applePay: boolean;
    googlePay: boolean;
  }>({ mpesa: true, airtelMoney: true, tkash: true, stripe: false, pesapal: false, flutterwave: false, applePay: false, googlePay: false });
  const [shippingRates, setShippingRates] = useState<{
    standard: number;
    express: number | null;
    pickup: number;
  }>({ standard: 300, express: 600, pickup: 0 });
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [savedMpesaNumbers, setSavedMpesaNumbers] = useState<{ id: string; phone: string; label: string | null; isDefault: boolean }[]>([]);
  const [savedCards, setSavedCards] = useState<{ id: string; last4: string; brand: string; expiryMonth: number; expiryYear: number; holderName?: string | null; isDefault: boolean }[]>([]);

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
      .then((data) =>
        setPaymentMethods({
          mpesa: data.mpesa ?? true,
          airtelMoney: data.airtelMoney ?? true,
          tkash: data.tkash ?? true,
          stripe: data.stripe ?? false,
          pesapal: data.pesapal ?? false,
          flutterwave: data.flutterwave ?? false,
          applePay: data.applePay ?? data.stripe ?? false,
          googlePay: data.googlePay ?? data.stripe ?? false,
        })
      )
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlacingOrder(false);
    }
  };

  // When order is placed, fetch saved payment methods for PaymentStep
  useEffect(() => {
    if (!placedOrderId || !session?.user) return;
    Promise.all([
      fetch("/api/account/payment-methods/mpesa").then((r) => r.json()),
      fetch("/api/account/payment-methods/cards").then((r) => r.json()),
    ]).then(([mpesaData, cardsData]) => {
      setSavedMpesaNumbers(mpesaData.numbers ?? []);
      setSavedCards(cardsData.cards ?? []);
    }).catch(() => {});
  }, [placedOrderId, session?.user]);

  const handlePaymentComplete = () => {
    useCartStore.getState().clearCart();
    resetCheckout();
    router.push(`/order-confirmation/${placedOrderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Checkout</h1>
        <div className="mb-8">
          <StepIndicator currentStep={step} onStepClick={setStep} />
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
                  {paymentMethods.airtelMoney && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "AIRTEL_MONEY"}
                        onChange={() => setPayment({ method: "AIRTEL_MONEY" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">Airtel Money</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Pay with your Airtel line — STK or Paybill</p>
                      </div>
                    </label>
                  )}
                  {paymentMethods.tkash && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "TKASH"}
                        onChange={() => setPayment({ method: "TKASH" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">TKash (Telkom)</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Pay with your Telkom line</p>
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
                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={payment.method === "CARD"}
                      onChange={() => setPayment({ method: "CARD" })}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium">Card (Visa / Mastercard)</span>
                      <p className="text-sm text-muted-foreground mt-0.5">Enter your card details below</p>
                    </div>
                  </label>
                  {paymentMethods.applePay && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "APPLE_PAY"}
                        onChange={() => setPayment({ method: "APPLE_PAY" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">Apple Pay</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Pay with Face ID or Touch ID</p>
                      </div>
                    </label>
                  )}
                  {paymentMethods.googlePay && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={payment.method === "GOOGLE_PAY"}
                        onChange={() => setPayment({ method: "GOOGLE_PAY" })}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-medium">Google Pay</span>
                        <p className="text-sm text-muted-foreground mt-0.5">Pay with your Google account</p>
                      </div>
                    </label>
                  )}
                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={payment.method === "BANK_TRANSFER"}
                      onChange={() => setPayment({ method: "BANK_TRANSFER" })}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-medium">Bank Transfer</span>
                      <p className="text-sm text-muted-foreground mt-0.5">Pay via bank transfer — enter card or account details below, then upload proof if needed</p>
                    </div>
                  </label>
                  {(payment.method === "BANK_TRANSFER" || payment.method === "CARD") && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                      <h3 className="text-sm font-medium">Card / payment details</h3>
                      <div>
                        <Label>Cardholder name</Label>
                        <Input
                          value={payment.cardholderName ?? ""}
                          onChange={(e) => setPayment({ cardholderName: e.target.value })}
                          placeholder="Name on card"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Card number</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          value={payment.cardNumber ?? ""}
                          onChange={(e) => setPayment({ cardNumber: e.target.value.replace(/\D/g, "").slice(0, 19) })}
                          placeholder="1234 5678 9012 3456"
                          className="mt-1 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Expiry (MM/YY)</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={payment.cardExpiry ?? ""}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                              if (v.length >= 2) setPayment({ cardExpiry: `${v.slice(0, 2)}/${v.slice(2)}` });
                              else setPayment({ cardExpiry: v });
                            }}
                            placeholder="MM/YY"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>CVC</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={payment.cardCvc ?? ""}
                            onChange={(e) => setPayment({ cardCvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                            placeholder="123"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Your card details are secured. For card payments we use Stripe or Pesapal; details are not stored on our servers.</p>
                    </div>
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
                  {(payment.method === "AIRTEL_MONEY" || payment.method === "TKASH") && (
                    <div className="pt-2">
                      <Label>{payment.method === "AIRTEL_MONEY" ? "Airtel" : "Telkom"} phone number</Label>
                      <Input
                        type="tel"
                        inputMode="tel"
                        value={payment.mobileMoneyPhone ?? contact.phone ?? ""}
                        onChange={(e) => setPayment({ mobileMoneyPhone: e.target.value })}
                        placeholder="+254 7XX XXX XXX"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.method === "AIRTEL_MONEY"
                          ? "We'll send a payment request to this Airtel number, or use Paybill after you place your order."
                          : "We'll send a payment request to this Telkom number, or use Paybill after you place your order."}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      ← Back
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => setStep(4)}
                      disabled={
                        (payment.method === "MPESA" && !(payment.mpesaPhone || contact.phone)) ||
                        ((payment.method === "AIRTEL_MONEY" || payment.method === "TKASH") && !(payment.mobileMoneyPhone || contact.phone))
                      }
                    >
                      Continue to Review →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4 — Review & Payment */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">
                    {placedOrderId ? "Complete payment" : "Review your order"}
                  </h2>
                </CardHeader>
                <CardContent className="space-y-6">
                  {placedOrderId ? (
                    <PaymentStep
                      order={{
                        id: placedOrderId,
                        orderNumber: placedOrderNumber,
                        totalKes: totals.total,
                      }}
                      savedMpesaNumbers={savedMpesaNumbers}
                      savedCards={savedCards}
                      onPaymentComplete={handlePaymentComplete}
                    />
                  ) : (
                    <>
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setStep(3)}
                          className="flex-1"
                        >
                          ← Back
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-primary/90 text-base py-6"
                          onClick={handleCreateOrder}
                          disabled={placingOrder || !termsAccepted}
                        >
                          {placingOrder ? "Creating order…" : `Place order — ${formatPrice(totals.total)}`}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        By placing your order you agree to our terms. You will then choose how to pay (M-Pesa, Paybill, Card, or Pay on Pickup).
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <CheckoutOrderSummary
              shippingFee={shippingFee}
              paymentMethod={
                step >= 3
                  ? payment.method === "MPESA"
                    ? "M-Pesa"
                    : payment.method === "AIRTEL_MONEY"
                      ? "Airtel Money"
                      : payment.method === "TKASH"
                        ? "TKash"
                        : payment.method === "CARD"
                          ? "Card"
                          : payment.method === "APPLE_PAY"
                            ? "Apple Pay"
                            : payment.method === "GOOGLE_PAY"
                              ? "Google Pay"
                              : payment.method === "BANK_TRANSFER"
                                ? "Bank Transfer"
                                : payment.method
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
