"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

/** Add business days (skip Sat/Sun) to a date */
function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

function formatEstimatedDelivery(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
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
    cartId,
    cartSessionId,
    setCartId,
    reset: resetCheckout,
  } = useCheckoutStore();

  const [error, setError] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<{
    mpesa: boolean;
    airtelMoney: boolean;
    tkash: boolean;
    pesapal: boolean;
  }>({ mpesa: true, airtelMoney: true, tkash: true, pesapal: false });
  const [shippingRates, setShippingRates] = useState<{
    standard: number | null;
    express: number | null;
    pickup: number;
    noZonesConfigured?: boolean;
    zoneId?: string;
    minDays?: number;
    maxDays?: number;
  }>({ standard: null, express: null, pickup: 0 });
  const [pickupLocations, setPickupLocations] = useState<{ sameCounty: PickupLoc[]; other: PickupLoc[]; all: PickupLoc[] }>({ sameCounty: [], other: [], all: [] });
  const [pickupLocationsLoading, setPickupLocationsLoading] = useState(false);
  type CourierLoc = { id: string; name: string; address?: string; city?: string; county?: string; phone?: string; trackingUrl?: string };
  const [courierLocations, setCourierLocations] = useState<{ sameCounty: CourierLoc[]; other: CourierLoc[]; all: CourierLoc[] }>({ sameCounty: [], other: [], all: [] });
  const [courierLocationsLoading, setCourierLocationsLoading] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState("");
  const [stkWaiting, setStkWaiting] = useState(false);
  const [stkPolling, setStkPolling] = useState(false);
  const [stkFailed, setStkFailed] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; recipientName: string | null; phone: string | null; line1: string; line2: string | null; city: string; county: string; isDefault: boolean }[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const hasAutoSelectedDefault = useRef(false);
  const [orderForSelf, setOrderForSelf] = useState(true);
  const [profileData, setProfileData] = useState<{ name?: string | null; email?: string | null; phone?: string | null } | null>(null);
  const hasPrefilledContactFromProfile = useRef(false);
  const [corporate, setCorporate] = useState<{
    id: string;
    companyName: string;
    discountPercent: number;
    paymentTerms: string;
    canUseNetTerms: boolean;
  } | null>(null);
  const [loyalty, setLoyalty] = useState<{ points: number; tier: string; kesValue: number } | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);

  const shippingFee =
    delivery.method === "PICKUP"
      ? 0
      : delivery.method === "EXPRESS"
        ? (shippingRates.express ?? shippingRates.standard ?? 0)
        : (delivery.fee ?? shippingRates.standard ?? 0);

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const baseTotals = calculateCartTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    shippingFee,
    couponDiscount
  );
  const corporateDiscountKes = corporate
    ? Math.round(baseTotals.subtotalInclVat * (corporate.discountPercent / 100))
    : 0;
  const totals =
    corporateDiscountKes === 0 && !useLoyalty
      ? baseTotals
      : calculateCartTotals(
          items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
          shippingFee,
          couponDiscount + corporateDiscountKes + (useLoyalty ? (loyalty?.kesValue ?? 0) : 0)
        );

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items.length, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/account/settings/addresses")
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list) && !("error" in list)) {
          setSavedAddresses(list);
        }
      })
      .catch(() => {});
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/account/settings/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name?: string | null; email?: string | null; phone?: string | null } | null) => {
        if (data) setProfileData(data);
      })
      .catch(() => {});
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/account/corporate/checkout")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { corporate?: { id: string; companyName: string; discountPercent: number; paymentTerms: string; canUseNetTerms: boolean } } | null) => {
        if (data?.corporate) setCorporate(data.corporate);
      })
      .catch(() => {});
  }, [session?.user]);

  // ABANDONED CART RECOVERY: Debounced contact saving
  useEffect(() => {
    const email = contact.email?.trim();
    const phone = contact.phone?.trim();
    if (!email && !phone) return;

    const timer = setTimeout(async () => {
      try {
        const payload = {
          sessionId: cartSessionId ?? undefined,
          cartId: cartId ?? undefined,
          email: email || undefined,
          phone: phone || undefined,
          items: items.map((i) =>
            isCatalogueCartItem(i)
              ? { catalogueItemId: i.catalogueItemId, quantity: i.quantity, unitPrice: i.unitPrice, name: i.name, slug: i.slug, type: "CATALOGUE" }
              : { productId: i.productId, variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice, name: i.name, slug: i.slug }
          ),
        };
        const res = await fetch("/api/checkout/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cartId && data.cartId !== cartId) {
            setCartId(data.cartId, data.sessionId ?? data.cartId);
          }
        }
      } catch (err) {
        console.error("Failed to sync abandoned cart data:", err);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [contact.email, contact.phone, cartId, cartSessionId, items, setCartId]);

  useEffect(() => {
    if (step !== 1 || !session?.user) return;
    if (!orderForSelf) {
      hasPrefilledContactFromProfile.current = false;
      return;
    }
    if (hasPrefilledContactFromProfile.current) return;
    const name = profileData?.name ?? (session?.user?.name as string | undefined) ?? "";
    const email = profileData?.email ?? (session?.user?.email as string | undefined) ?? "";
    const phone = profileData?.phone ?? "";
    if (!email && !name && !phone) return;
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") ?? "";
    setContact({ email: email || "", firstName: firstName || "", lastName: lastName || "", phone: phone || "" });
    if (profileData) hasPrefilledContactFromProfile.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store setters are stable
  }, [step, session?.user, orderForSelf, profileData]);

  useEffect(() => {
    if (hasAutoSelectedDefault.current || savedAddresses.length === 0 || step !== 2 || delivery.method === "PICKUP") return;
    const defaultAddr = savedAddresses.find((a) => a.isDefault);
    if (!defaultAddr) return;
    hasAutoSelectedDefault.current = true;
    setSelectedSavedAddressId(defaultAddr.id);
    const parts = (defaultAddr.recipientName ?? "").trim().split(/\s+/);
    setContact({ firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") ?? "", phone: defaultAddr.phone ?? "" });
    setDelivery({ street: defaultAddr.line1, area: defaultAddr.line2 ?? "", city: defaultAddr.city, county: defaultAddr.county });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- store setters are stable
  }, [savedAddresses, step, delivery.method]);

  useEffect(() => {
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then((data) =>
        setPaymentMethods({
          mpesa: data.mpesa ?? true,
          airtelMoney: data.airtelMoney ?? true,
          tkash: data.tkash ?? true,
          pesapal: data.pesapal ?? false,
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!delivery.county) return;
    fetch(`/api/shipping/fee?county=${encodeURIComponent(delivery.county)}`)
      .then((r) => r.json())
      .then((data) => {
        setShippingRates({
          standard: data.standard ?? null,
          express: data.express ?? null,
          pickup: data.pickup ?? 0,
          noZonesConfigured: data.noZonesConfigured ?? false,
          zoneId: data.zoneId ?? undefined,
          minDays: data.minDays ?? undefined,
          maxDays: data.maxDays ?? undefined,
        });
      })
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

  useEffect(() => {
    setCourierLocationsLoading(true);
    const county = (delivery.county ?? "").trim();
    const url = county ? `/api/shipping/courier-locations?county=${encodeURIComponent(county)}` : "/api/shipping/courier-locations";
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        setCourierLocations({
          sameCounty: Array.isArray(data.sameCounty) ? data.sameCounty : [],
          other: Array.isArray(data.other) ? data.other : [],
          all: Array.isArray(data.all) ? data.all : [],
        })
      )
      .catch(() => setCourierLocations({ sameCounty: [], other: [], all: [] }))
      .finally(() => setCourierLocationsLoading(false));
  }, [delivery.county]);

  // Sync delivery fee, zoneId, and estimated delivery date when method or shipping rates change
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
    const productionDays = 3;
    const transitDays =
      delivery.method === "EXPRESS"
        ? 1
        : shippingRates.minDays != null
          ? Math.ceil(((shippingRates.minDays + (shippingRates.maxDays ?? shippingRates.minDays)) / 2))
          : 3;
    const totalBusinessDays = productionDays + transitDays;
    const estimatedDate = addBusinessDays(new Date(), totalBusinessDays);
    setDelivery({
      fee,
      estimatedDays: delivery.method === "EXPRESS" ? "1-2" : (shippingRates.minDays != null && shippingRates.maxDays != null ? `${shippingRates.minDays}-${shippingRates.maxDays}` : "3-5"),
      deliveryZoneId: shippingRates.zoneId,
      estimatedDelivery: standardAvailable && (delivery.method === "STANDARD" || delivery.method === "EXPRESS") ? estimatedDate.toISOString() : undefined,
    });
  }, [delivery.method, shippingRates.standard, shippingRates.express, shippingRates.zoneId, shippingRates.minDays, shippingRates.maxDays, setDelivery]);

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
    cartId: cartId ?? undefined,
    corporateId: corporate?.id ?? undefined,
    isNetTerms:
      payment.method === "INVOICE_NET_30" || payment.method === "INVOICE_NET_60",
    poReference: payment.poReference?.trim() || undefined,
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
    preferredCourierId: !isPickup ? (delivery.preferredCourierId ?? undefined) : undefined,
    deliveryNotes: delivery.notes || undefined,
    deliveryZoneId: !isPickup ? (delivery.deliveryZoneId ?? undefined) : undefined,
    estimatedDelivery: !isPickup && delivery.estimatedDelivery ? delivery.estimatedDelivery : undefined,
    shippingCost: shippingFee,
    discount: totals.discountKes,
    loyaltyPoints: useLoyalty ? loyalty?.points : 0,
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

  const handlePlaceOrderWithInvoice = async () => {
    if (!termsAccepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    const order = await createOrder();
    if (order) {
      setPlacedOrderId(order.id);
      setPlacedOrderNumber(order.orderNumber);
      useCartStore.getState().clearCart();
      setStep(4);
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
                  {session?.user && (
                    <div>
                      <Label className="mb-2 block">Who is this order for?</Label>
                      <div className="space-y-2">
                        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="orderFor"
                            checked={orderForSelf}
                            onChange={() => {
                              setOrderForSelf(true);
                              hasPrefilledContactFromProfile.current = false;
                            }}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-medium">Ordering for myself</span>
                            <p className="text-sm text-muted-foreground mt-0.5">We&apos;ve filled your details from your profile. You can change them below if needed.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="orderFor"
                            checked={!orderForSelf}
                            onChange={() => {
                              setOrderForSelf(false);
                              hasPrefilledContactFromProfile.current = false;
                              setContact({ firstName: "", lastName: "", phone: "" });
                            }}
                            className="mt-1"
                          />
                          <div>
                            <span className="font-medium">Sending as a gift (or to someone else)</span>
                            <p className="text-sm text-muted-foreground mt-0.5">Enter the recipient&apos;s name and phone below. Order confirmation will still go to your email.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Email address *</Label>
                    <Input
                      type="email"
                      value={contact.email ?? ""}
                      onChange={(e) => setContact({ email: e.target.value })}
                      placeholder="you@example.com"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {orderForSelf ? "We'll send your order confirmation here" : "Your email — we'll send the order confirmation to you"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{orderForSelf ? "First name *" : "Recipient first name *"}</Label>
                      <Input
                        value={contact.firstName ?? ""}
                        onChange={(e) => setContact({ firstName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{orderForSelf ? "Last name *" : "Recipient last name *"}</Label>
                      <Input
                        value={contact.lastName ?? ""}
                        onChange={(e) => setContact({ lastName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{orderForSelf ? "Phone number *" : "Recipient phone number *"}</Label>
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
                    disabled={!canContinueStep1}
                    onClick={async () => {
                      try {
                        const cartPayload = {
                          sessionId: cartSessionId ?? undefined,
                          cartId: cartId ?? undefined,
                          email: contact.email ?? undefined,
                          phone: contact.phone ?? undefined,
                          items: items.map((i) =>
                            isCatalogueCartItem(i)
                              ? { catalogueItemId: i.catalogueItemId, quantity: i.quantity, unitPrice: i.unitPrice, name: i.name, slug: i.slug, type: "CATALOGUE" }
                              : { productId: i.productId, variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice, name: i.name, slug: i.slug }
                          ),
                        };
                        const res = await fetch("/api/checkout/cart", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(cartPayload),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.cartId) setCartId(data.cartId, data.sessionId ?? data.cartId);
                        }
                      } catch {
                        // non-blocking
                      }
                      setStep(2);
                    }}
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
                  {/* 1. Your delivery address first: saved addresses (if any) + add new address form */}
                  <div className="space-y-4">
                    <Label className="block font-medium">Your delivery address</Label>
                    {session?.user && savedAddresses.length > 0 ? (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Choose a saved address or add a new one in the form below.</p>
                        <div className="space-y-2">
                          {savedAddresses.map((addr) => (
                            <label
                              key={addr.id}
                              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                            >
                              <input
                                type="radio"
                                name="savedAddress"
                                checked={selectedSavedAddressId === addr.id}
                                onChange={() => {
                                  setSelectedSavedAddressId(addr.id);
                                  const parts = (addr.recipientName ?? "").trim().split(/\s+/);
                                  const firstName = parts[0] ?? "";
                                  const lastName = parts.slice(1).join(" ") ?? "";
                                  setContact({ firstName: firstName || contact.firstName, lastName: lastName || contact.lastName, phone: addr.phone ?? contact.phone });
                                  setDelivery({ street: addr.line1, area: addr.line2 ?? "", city: addr.city, county: addr.county });
                                }}
                                className="mt-1"
                              />
                              <div className="text-sm">
                                <span className="font-medium">{addr.label}{addr.isDefault ? " (Default)" : ""}</span>
                                <p className="text-muted-foreground mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""} — {addr.city}, {addr.county}</p>
                              </div>
                            </label>
                          ))}
                          <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={selectedSavedAddressId === null}
                              onChange={() => setSelectedSavedAddressId(null)}
                              className="mt-1"
                            />
                            <span className="text-sm font-medium">Add a new address</span>
                          </label>
                        </div>
                      </div>
                    ) : session?.user ? (
                      <p className="text-sm text-muted-foreground">No saved addresses yet. Fill in the form below; we&apos;ll save it to your profile for next time.</p>
                    ) : null}
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
                  </div>

                  {/* 2. Delivery method */}
                  <div className="pt-4 border-t">
                    <Label className="block mb-2">Delivery method</Label>
                    {shippingRates.standard == null ? (
                      <div className="space-y-2">
                        {delivery.county && (
                          <p className="text-sm text-muted-foreground rounded-lg border border-amber-200 bg-amber-50 p-3">
                            {shippingRates.noZonesConfigured
                              ? "Delivery rates are not set up yet for your area. Please choose Pick up below or contact us."
                              : "Delivery is not available for this county yet. Please choose Pick up or contact us."}
                          </p>
                        )}
                        {!delivery.county && (
                          <p className="text-sm text-muted-foreground">Select a county in your delivery address above to see if delivery is available and the cost.</p>
                        )}
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={delivery.method === "STANDARD"}
                            onChange={() => setDelivery({ method: "STANDARD", fee: 0 })}
                          />
                          <span>Standard Delivery — {delivery.county ? "Not available for this county" : "Select county to see cost"}</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            checked={delivery.method === "EXPRESS"}
                            onChange={() => setDelivery({ method: "EXPRESS", fee: 0 })}
                          />
                          <span>Express — {delivery.county ? "Not available for this county" : "Select county to see cost"}</span>
                        </label>
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
                          <span>Standard Delivery — {formatPrice(shippingRates.standard ?? 0)} — {shippingRates.minDays != null && shippingRates.maxDays != null ? `${shippingRates.minDays}–${shippingRates.maxDays}` : "3–5"} business days</span>
                        </label>
                        {(delivery.method === "STANDARD" && delivery.estimatedDelivery) && (
                          <p className="text-sm text-muted-foreground pl-6">Estimated delivery: {formatEstimatedDelivery(new Date(delivery.estimatedDelivery))}</p>
                        )}
                        {(shippingRates.express ?? 0) > 0 && (
                          <>
                            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                              <input
                                type="radio"
                                name="deliveryMethod"
                                checked={delivery.method === "EXPRESS"}
                                onChange={() => setDelivery({ method: "EXPRESS", fee: shippingRates.express ?? shippingRates.standard ?? 0 })}
                              />
                              <span>Express — {formatPrice(shippingRates.express ?? 0)} — 1–2 business days</span>
                            </label>
                            {(delivery.method === "EXPRESS" && delivery.estimatedDelivery) && (
                              <p className="text-sm text-muted-foreground pl-6">Estimated delivery: {formatEstimatedDelivery(new Date(delivery.estimatedDelivery))}</p>
                            )}
                          </>
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
                        {(delivery.method === "STANDARD" || delivery.method === "EXPRESS") && courierLocations.all.length > 0 && (
                          <div className="pt-4 border-t mt-4">
                            <Label className="mb-2 block">Preferred courier location</Label>
                            <p className="text-sm text-muted-foreground mb-2">Select the nearest courier branch for delivery. Tracking and courier contact will be available after dispatch.</p>
                            {courierLocationsLoading ? (
                              <p className="text-sm text-muted-foreground py-2">Loading…</p>
                            ) : (
                              <div className="space-y-2">
                                {courierLocations.sameCounty.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Near you (same county)</p>
                                    {courierLocations.sameCounty.map((c) => (
                                      <label key={c.id} className="flex items-start gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                          type="radio"
                                          name="preferredCourier"
                                          checked={(delivery.preferredCourierId ?? "") === c.id}
                                          onChange={() => setDelivery({ preferredCourierId: c.id, preferredCourierName: c.name })}
                                          className="mt-1"
                                        />
                                        <span className="text-sm">
                                          <span className="font-medium">{c.name}</span>
                                          {(c.address || c.city) && (
                                            <span className="text-muted-foreground"> — {[c.address, c.city, c.county].filter(Boolean).join(", ")}</span>
                                          )}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                {courierLocations.other.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{courierLocations.sameCounty.length > 0 ? "Other locations" : "Courier locations"}</p>
                                    {courierLocations.other.map((c) => (
                                      <label key={c.id} className="flex items-start gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <input
                                          type="radio"
                                          name="preferredCourier"
                                          checked={(delivery.preferredCourierId ?? "") === c.id}
                                          onChange={() => setDelivery({ preferredCourierId: c.id, preferredCourierName: c.name })}
                                          className="mt-1"
                                        />
                                        <span className="text-sm">
                                          <span className="font-medium">{c.name}</span>
                                          {(c.address || c.city) && (
                                            <span className="text-muted-foreground"> — {[c.address, c.city, c.county].filter(Boolean).join(", ")}</span>
                                          )}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
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
                    {corporate?.canUseNetTerms && (corporate.paymentTerms === "NET_30" || corporate.paymentTerms === "NET_60" || corporate.paymentTerms === "NET_14") && (
                      <button
                        type="button"
                        onClick={() =>
                          setPayment({
                            method: corporate.paymentTerms === "NET_60" ? "INVOICE_NET_60" : "INVOICE_NET_30",
                          })
                        }
                        className={`rounded-xl border-2 p-4 text-left transition ${payment.method === "INVOICE_NET_30" || payment.method === "INVOICE_NET_60" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                      >
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                          <Building2 className="h-5 w-5 text-slate-600" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          Invoice (Net-{corporate.paymentTerms === "NET_60" ? "60" : corporate.paymentTerms === "NET_14" ? "14" : "30"})
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Pay within {corporate.paymentTerms === "NET_60" ? "60" : corporate.paymentTerms === "NET_14" ? "14" : "30"} days
                        </p>
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
                      <p className="text-xs text-muted-foreground">Your card details are secured. For card payments we use PesaPal; details are not stored on our servers.</p>
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
                  {(payment.method === "INVOICE_NET_30" || payment.method === "INVOICE_NET_60") && (
                    <div className="pt-2">
                      <Label>PO / Reference (optional)</Label>
                      <Input
                        type="text"
                        value={payment.poReference ?? ""}
                        onChange={(e) => setPayment({ poReference: e.target.value })}
                        placeholder="e.g. PO-12345"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        We&apos;ll send an invoice to your account email. Pay within the agreed terms.
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
                  <Label htmlFor="terms-step3">I agree to the Terms of Service and Refund Policy *</Label>
                  </div>

                  {loyalty && loyalty.points > 0 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary">
                          <Smartphone className="h-5 w-5" />
                          <span className="font-semibold">Loyalty Rewards</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {loyalty.tier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">Available: <span className="font-medium text-foreground">{loyalty.points} points</span></p>
                        <p className="text-muted-foreground">Worth: <span className="font-medium text-foreground">{formatPrice(loyalty.kesValue)}</span></p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseLoyalty(!useLoyalty)}
                        className={`w-full py-2 px-4 rounded-lg border-2 transition-all flex items-center justify-between ${useLoyalty ? "border-primary bg-primary text-white" : "border-primary/30 text-primary hover:bg-primary/5"}`}
                      >
                        <span className="text-sm font-medium">{useLoyalty ? "Applied to Order" : "Apply Points to Order"}</span>
                        {useLoyalty ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>-{loyalty.points} pts</span>}
                      </button>
                      <p className="text-[10px] text-muted-foreground text-center">Points will be deducted upon successful order placement.</p>
                    </div>
                  )}

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
                    ) : payment.method === "INVOICE_NET_30" || payment.method === "INVOICE_NET_60" ? (
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={handlePlaceOrderWithInvoice}
                        disabled={placingOrder || !termsAccepted}
                      >
                        {placingOrder ? "Creating order…" : "Place order (pay by invoice)"}
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

            {/* Step 4 — Order placed (after payment or invoice order) */}
            {step === 4 && placedOrderId && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-lg">Order placed</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {payment.method === "INVOICE_NET_30" || payment.method === "INVOICE_NET_60"
                      ? "Thank you. Your order has been placed. We'll send an invoice to your email; please pay within the agreed terms."
                      : "Thank you. Your payment was successful and your order has been placed."}
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
              corporate={corporate ? { discountPercent: corporate.discountPercent, companyName: corporate.companyName } : undefined}
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
                                : payment.method === "INVOICE_NET_30" || payment.method === "INVOICE_NET_60"
                                  ? "Invoice (Net terms)"
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
