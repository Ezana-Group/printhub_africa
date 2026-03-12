"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Smartphone, CreditCard, Building2, Wallet, Loader2 } from "lucide-react";

const PHONE_REGEX = /^\+?254[17]\d{8}$/;

type PickupLoc = { id: string; name: string; city: string; county: string; street: string };
function PickupLocationSelector({
  sameCounty,
  other,
  all,
  loading,
  selectedId,
  onSelect,
}: {
  sameCounty: PickupLoc[];
  other: PickupLoc[];
  all: PickupLoc[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string, name: string) => void;
}) {
  if (loading) return <p className="text-sm text-muted-foreground py-2">Loading pickup locations…</p>;
  if (all.length === 0) return <p className="text-sm text-amber-600 py-2">No pickup locations configured. Please contact us.</p>;
  const renderList = (list: PickupLoc[], label: string) =>
    list.length > 0 ? (
      <div key={label} className="mt-2">
        {label && <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>}
        <div className="space-y-1">
          {list.map((loc) => (
            <label key={loc.id} className="flex items-start gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="pickupLocation"
                value={loc.id}
                checked={selectedId === loc.id}
                onChange={() => onSelect(loc.id, loc.name)}
                className="mt-1"
              />
              <span className="text-sm">
                <span className="font-medium">{loc.name}</span>
                <span className="text-muted-foreground"> — {loc.street}, {loc.city}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    ) : null;
  return (
    <div className="pl-6 border-l-2 border-muted mt-2 space-y-2">
      {sameCounty.length > 0 && renderList(sameCounty, "Near you (same county)")}
      {other.length > 0 && renderList(other, sameCounty.length > 0 ? "Other locations" : "Pickup locations")}
    </div>
  );
}

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
    standard: number | null;
    express: number | null;
    pickup: number;
    noZonesConfigured?: boolean;
  }>({ standard: null, express: null, pickup: 0 });
  const [pickupLocations, setPickupLocations] = useState<{ sameCounty: PickupLoc[]; other: PickupLoc[]; all: PickupLoc[] }>({ sameCounty: [], other: [], all: [] });
  const [pickupLocationsLoading, setPickupLocationsLoading] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [stkWaiting, setStkWaiting] = useState(false);
  const [stkPolling, setStkPolling] = useState(false);
  const [stkFailed, setStkFailed] = useState(false);

  const shippingFee =
    delivery.method === "PICKUP"
      ? 0
      : delivery.method === "EXPRESS"
        ? (shippingRates.express ?? shippingRates.standard ?? 0)
        : (delivery.fee ?? shippingRates.standard ?? 0);

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
          standard: data.standard ?? null,
          express: data.express ?? null,
          pickup: data.pickup ?? 0,
          noZonesConfigured: data.noZonesConfigured ?? false,
        })
      )
      .catch(() => setShippingRates({ standard: null, express: null, pickup: 0, noZonesConfigured: true }));
  }, [delivery.county]);

  useEffect(() => {
    setPickupLocationsLoading(true);
    const county = (delivery.county ?? "").trim();
    const url = county ? `/api/shipping/pickup-locations?county=${encodeURIComponent(county)}` : "/api/shipping/pickup-locations";
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        setPickupLocations({
          sameCounty: Array.isArray(data.sameCounty) ? data.sameCounty : [],
          other: Array.isArray(data.other) ? data.other : [],
          all: Array.isArray(data.all) ? data.all : [],
        })
      )
      .catch(() => setPickupLocations({ sameCounty: [], other: [], all: [] }))
      .finally(() => setPickupLocationsLoading(false));
  }, [delivery.county]);

  // Sync delivery fee when method or shipping rates change; switch to PICKUP if delivery not available for county
  useEffect(() => {
    const standardAvailable = shippingRates.standard != null;
    if (!standardAvailable && (delivery.method === "STANDARD" || delivery.method === "EXPRESS")) {
      setDelivery({ method: "PICKUP", fee: 0 });
      return;
    }
    const fee =
      delivery.method === "PICKUP"
        ? 0
        : delivery.method === "EXPRESS"
          ? shippingRates.express ?? shippingRates.standard ?? 0
          : shippingRates.standard ?? 0;
    setDelivery({ fee });
  }, [delivery.method, shippingRates.standard, shippingRates.express, setDelivery]);

  const canContinueStep1 =
    contact.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) &&
    (contact.firstName ?? "").trim().length >= 2 &&
    (contact.lastName ?? "").trim().length >= 2 &&
    PHONE_REGEX.test(normalizePhone(contact.phone ?? "")) &&
    (!createAccount || (password && password.length >= 8));

  const isPickup = delivery.method === "PICKUP";
  const canContinueStep2 = isPickup
    ? (delivery.county ?? "").trim() && (delivery.city ?? "").trim() && (delivery.pickupLocationId ?? "").trim()
    : (delivery.street ?? "").trim() &&
      (delivery.area ?? "").trim() &&
      (delivery.county ?? "").trim() &&
      (delivery.city ?? "").trim();

  const buildOrderPayload = () => ({
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
      street: isPickup ? (delivery.pickupLocationName ?? "Pickup") : (delivery.street ?? ""),
      city: delivery.city ?? "Nairobi",
      county: delivery.county ?? "",
      postalCode: delivery.postalCode || undefined,
      deliveryMethod:
        delivery.method === "STANDARD"
          ? "Standard"
          : delivery.method === "EXPRESS"
            ? "Express"
            : "Pickup",
    },
    pickupLocationId: isPickup ? delivery.pickupLocationId ?? undefined : undefined,
    deliveryNotes: delivery.notes || undefined,
    shippingCost: shippingFee,
    discount: appliedCoupon?.discountAmount ?? 0,
  });

  const createOrder = async (): Promise<{ id: string; orderNumber: string } | null> => {
    setPlacingOrder(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOrderPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setOrderId(data.order.id);
      setPlacedOrderId(data.order.id);
      setPlacedOrderNumber(data.order.orderNumber);
      return { id: data.order.id, orderNumber: data.order.orderNumber };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setPlacingOrder(false);
    }
  };

  const pollMpesaStatus = useCallback(
    (checkoutRequestId: string, orderId: string) => {
      let attempts = 0;
      const maxAttempts = 24;
      const poll = async () => {
        try {
          const res = await fetch(
            `/api/payments/mpesa/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}&orderId=${encodeURIComponent(orderId)}`
          );
          const data = await res.json();
          if (data.status === "CONFIRMED") {
            setStkPolling(false);
            setStkWaiting(false);
            setStep(4);
            return;
          }
          if (data.status === "FAILED") {
            setStkPolling(false);
            setStkWaiting(false);
            setStkFailed(true);
            return;
          }
          attempts++;
          if (attempts < maxAttempts) setTimeout(poll, 5000);
          else {
            setStkPolling(false);
            setStkWaiting(false);
            setStkFailed(true);
          }
        } catch {
          attempts++;
          if (attempts < maxAttempts) setTimeout(poll, 5000);
          else {
            setStkPolling(false);
            setStkWaiting(false);
            setStkFailed(true);
          }
        }
      };
      poll();
    },
    [setStep]
  );

  const handlePayWithMpesa = async () => {
    if (!termsAccepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    const phone = payment.mpesaPhone ?? contact.phone ?? "";
    const normalized = normalizePhone(phone).replace(/\D/g, "");
    if (normalized.length < 9) {
      setError("Enter a valid M-Pesa phone number.");
      return;
    }
    setError("");
    setStkFailed(false);
    const order = await createOrder();
    if (!order) return;
    setStkWaiting(true);
    try {
      const res = await fetch("/api/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, phone: normalized.startsWith("254") ? normalized : "254" + normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "STK push failed");
      setStkPolling(true);
      pollMpesaStatus(data.checkoutRequestId, order.id);
    } catch (e) {
      setStkWaiting(false);
      setError(e instanceof Error ? e.message : "Payment request failed");
      setStkFailed(true);
    }
  };

  const handleProceedToPaymentPage = async () => {
    if (!termsAccepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    const order = await createOrder();
    if (order) {
      useCartStore.getState().clearCart();
      resetCheckout();
      router.push(`/pay/${order.id}`);
    }
  };

  const handleStepClick = (s: 1 | 2 | 3 | 4) => {
    if (s === 4 && !placedOrderId) return;
    setStep(s);
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
          <StepIndicator currentStep={step} onStepClick={handleStepClick} />
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
                    {shippingRates.standard == null ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground rounded-lg border border-amber-200 bg-amber-50 p-3">
                          {shippingRates.noZonesConfigured
                            ? "Delivery rates are not set up yet for your area. Please choose Pick up below or contact us."
                            : "Delivery is not available for this county yet. Please choose Pick up or contact us."}
                        </p>
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={delivery.method === "PICKUP"}
                            onChange={() => setDelivery({ method: "PICKUP", fee: 0 })}
                          />
                          <span>Pick up — {delivery.pickupLocationName ? `${delivery.pickupLocationName} — FREE` : "Select location below — FREE"}</span>
                        </label>
                        {delivery.method === "PICKUP" && (
                          <PickupLocationSelector
                            sameCounty={pickupLocations.sameCounty}
                            other={pickupLocations.other}
                            all={pickupLocations.all}
                            loading={pickupLocationsLoading}
                            selectedId={delivery.pickupLocationId ?? ""}
                            onSelect={(id, name) => setDelivery({ pickupLocationId: id, pickupLocationName: name })}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={delivery.method === "STANDARD"}
                            onChange={() => setDelivery({ method: "STANDARD", fee: shippingRates.standard ?? 0 })}
                          />
                          <span>Standard Delivery — {formatPrice(shippingRates.standard ?? 0)} — 3–5 business days</span>
                        </label>
                        {(shippingRates.express ?? 0) > 0 && (
                          <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                              type="radio"
                              name="deliveryMethod"
                              checked={delivery.method === "EXPRESS"}
                              onChange={() => setDelivery({ method: "EXPRESS", fee: shippingRates.express ?? shippingRates.standard ?? 0 })}
                            />
                            <span>Express — {formatPrice(shippingRates.express ?? 0)} — 1–2 business days</span>
                          </label>
                        )}
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={delivery.method === "PICKUP"}
                            onChange={() => setDelivery({ method: "PICKUP", fee: 0 })}
                          />
                          <span>Pick up — {delivery.pickupLocationName ? `${delivery.pickupLocationName} — FREE` : "Select location below — FREE"}</span>
                        </label>
                        {delivery.method === "PICKUP" && (
                          <PickupLocationSelector
                            sameCounty={pickupLocations.sameCounty}
                            other={pickupLocations.other}
                            all={pickupLocations.all}
                            loading={pickupLocationsLoading}
                            selectedId={delivery.pickupLocationId ?? ""}
                            onSelect={(id, name) => setDelivery({ pickupLocationId: id, pickupLocationName: name })}
                          />
                        )}
                      </div>
                    )}
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

            {/* Step 3 — Payment: complete payment here; Review (step 4) only after payment succeeds */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Payment</h2>
                  <p className="text-sm text-muted-foreground">Complete payment to place your order. Review is shown after payment.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stkWaiting ? (
                    <div className="rounded-xl border border-muted bg-muted/30 p-6 text-center space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                      <p className="font-medium">Complete payment on your phone</p>
                      <p className="text-sm text-muted-foreground">
                        {stkPolling ? "Checking payment status…" : "An M-Pesa prompt was sent. Enter your PIN to pay."}
                      </p>
                    </div>
                  ) : stkFailed && placedOrderId ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                      <p className="text-sm font-medium text-amber-800">STK push didn’t go through</p>
                      <p className="text-sm text-amber-700">Complete payment via Paybill or try again on the payment page.</p>
                      <Button className="w-full" onClick={() => { useCartStore.getState().clearCart(); resetCheckout(); router.push(`/pay/${placedOrderId}`); }}>
                        Open payment page
                      </Button>
                    </div>
                  ) : (
                  <>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.mpesa && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "MPESA" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "MPESA" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                          <Smartphone className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">M-Pesa</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">STK push to your phone</p>
                      </button>
                    )}
                    {paymentMethods.airtelMoney && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "AIRTEL_MONEY" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "AIRTEL_MONEY" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                          <Wallet className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Airtel Money</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Pay with your Airtel line</p>
                      </button>
                    )}
                    {paymentMethods.tkash && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "TKASH" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "TKASH" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                          <Smartphone className="h-5 w-5 text-slate-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">TKash (Telkom)</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Pay with your Telkom line</p>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPayment({ method: "CARD" })}
                      className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "CARD" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    >
                      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Card</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Visa or Mastercard</p>
                    </button>
                    {paymentMethods.stripe && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "STRIPE" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "STRIPE" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Card (Stripe)</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Visa or Mastercard</p>
                      </button>
                    )}
                    {paymentMethods.pesapal && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "PESAPAL" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "PESAPAL" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Pesapal</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Card via Pesapal</p>
                      </button>
                    )}
                    {paymentMethods.flutterwave && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "FLUTTERWAVE" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "FLUTTERWAVE" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Flutterwave</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Cards & mobile money</p>
                      </button>
                    )}
                    {paymentMethods.applePay && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "APPLE_PAY" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "APPLE_PAY" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                          <CreditCard className="h-5 w-5 text-slate-700" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Apple Pay</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Face ID or Touch ID</p>
                      </button>
                    )}
                    {paymentMethods.googlePay && (
                      <button
                        type="button"
                        onClick={() => setPayment({ method: "GOOGLE_PAY" })}
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "GOOGLE_PAY" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                          <CreditCard className="h-5 w-5 text-slate-700" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Google Pay</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Pay with Google</p>
                      </button>
                    )}
                  </div>
                  {payment.method === "CARD" && (
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
                      <p className="text-xs text-muted-foreground mt-1">We&apos;ll send an STK push to this number to complete payment.</p>
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
                        You&apos;ll complete payment on the next page (M-Pesa or Paybill).
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="terms-step3"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="terms-step3">I agree to PrintHub&apos;s Terms of Service and Privacy Policy *</Label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      ← Back
                    </Button>
                    {payment.method === "MPESA" ? (
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={handlePayWithMpesa}
                        disabled={placingOrder || !termsAccepted || !(payment.mpesaPhone || contact.phone)}
                      >
                        {placingOrder ? "Creating order…" : "Pay with M-Pesa"}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={handleProceedToPaymentPage}
                        disabled={placingOrder || !termsAccepted}
                      >
                        {placingOrder ? "Creating order…" : "Proceed to payment"}
                      </Button>
                    )}
                  </div>
                  </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4 — Order placed (only shown after payment succeeds) */}
            {step === 4 && placedOrderId && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Order placed</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Thank you. Your payment was successful and your order has been placed.
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Order number</p>
                    <p className="text-lg font-semibold font-mono">{placedOrderNumber}</p>
                    <p className="text-sm text-muted-foreground pt-2">
                      Total: {formatPrice(totals.total)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent a confirmation to your email.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      useCartStore.getState().clearCart();
                      resetCheckout();
                      router.push(`/order-confirmation/${placedOrderId}`);
                    }}
                  >
                    View order confirmation
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/shop">Continue shopping</Link>
                  </Button>
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
