"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Plus, Minus, Trash2, Building2 } from "lucide-react";
import { KENYA_COUNTIES } from "@/lib/constants";

type OrderItem = {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
};

type CustomerSearchResult = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  corporateAccount?: {
    id: string;
    companyName: string;
    accountNumber: string;
    discountPercent: number;
    paymentTerms: string;
    creditLimit: number;
    creditUsed: number;
  } | null;
};

type ProductSearchResult = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  category: { name: string };
  mainImageUrl: string | null;
};

interface AdminCreateOrderFormProps {
  preselectedCustomerId?: string;
  preselectedCorporateId?: string; // reserved for future use (e.g. pre-fill corporate)
}

export function AdminCreateOrderForm({
  preselectedCustomerId,
}: AdminCreateOrderFormProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerSearchResult | null>(null);
  const [corporate, setCorporate] = useState<CustomerSearchResult["corporateAccount"] | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCounty, setDeliveryCounty] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("STANDARD_COURIER");
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_PICKUP");
  const [poReference, setPoReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!preselectedCustomerId) return;
    fetch(`/api/admin/customers/${preselectedCustomerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.customer) {
          setCustomer(data.customer);
          setCorporate(data.customer.corporateAccount ?? null);
        }
      })
      .catch(() => {});
  }, [preselectedCustomerId]);

  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(
        `/api/admin/customers/search?q=${encodeURIComponent(customerSearch)}`
      )
        .then((r) => r.json())
        .then((data) => setCustomerResults(data.customers ?? []))
        .catch(() => setCustomerResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  useEffect(() => {
    if (productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(
        `/api/admin/products/search?q=${encodeURIComponent(productSearch)}`
      )
        .then((r) => r.json())
        .then((data) => setProductResults(data.products ?? []))
        .catch(() => setProductResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = corporate
    ? Math.round(subtotal * (corporate.discountPercent / 100))
    : 0;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = Math.round((afterDiscount * 0.16) / 1.16);
  const deliveryFee = deliveryMethod === "CUSTOMER_PICKUP" ? 0 : 200;
  const total = afterDiscount + deliveryFee;

  const handleSubmit = useCallback(async () => {
    if (!customer || items.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          corporateId: corporate?.id ?? null,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
          deliveryAddress,
          deliveryCounty,
          deliveryMethod,
          paymentMethod,
          poReference: poReference || null,
          adminNotes: notes || null,
          subtotal,
          discountAmount,
          vatAmount,
          deliveryFee,
          total,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create order");
      }
      const { order } = await res.json();
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    customer,
    corporate,
    items,
    deliveryAddress,
    deliveryCounty,
    deliveryMethod,
    paymentMethod,
    poReference,
    notes,
    subtotal,
    discountAmount,
    vatAmount,
    deliveryFee,
    total,
    router,
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Customer</h2>
        {customer ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {customer.name?.charAt(0) ?? "U"}
              </div>
              <div>
                <p className="font-medium text-foreground">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                {corporate && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-primary">
                    <Building2 className="h-3 w-3" />
                    {corporate.companyName} · {corporate.accountNumber}
                    {corporate.discountPercent > 0 && (
                      <span className="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        {corporate.discountPercent}% discount
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomer(null);
                setCorporate(null);
              }}
              className="text-sm text-muted-foreground hover:text-destructive"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customer by name or email..."
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {customerResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomer(c);
                      setCorporate(c.corporateAccount ?? null);
                      setCustomerSearch("");
                      setCustomerResults([]);
                    }}
                    className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left last:border-0 hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {c.name?.charAt(0) ?? "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.email}
                        {c.corporateAccount && (
                          <span className="ml-2 text-primary">
                            · {c.corporateAccount.companyName}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Order Items</h2>
        {items.length > 0 && (
          <div className="mb-4 space-y-2">
            {items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}`}
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    KES {item.price.toLocaleString()} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...items];
                      if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                      else updated.splice(idx, 1);
                      setItems(updated);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...items];
                      updated[idx].quantity += 1;
                      setItems(updated);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="w-24 text-right text-sm font-semibold text-foreground">
                  KES {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products to add..."
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {productResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-10 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const existing = items.find((i) => i.productId === p.id);
                    if (existing) {
                      setItems(
                        items.map((i) =>
                          i.productId === p.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                        )
                      );
                    } else {
                      setItems([
                        ...items,
                        {
                          productId: p.id,
                          variantId: null,
                          name: p.name,
                          price: p.basePrice,
                          quantity: 1,
                        },
                      ]);
                    }
                    setProductSearch("");
                    setProductResults([]);
                  }}
                  className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left last:border-0 hover:bg-muted/50"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {p.mainImageUrl ? (
                      <Image
                        src={p.mainImageUrl}
                        alt={p.name}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        IMG
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category?.name}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    KES {p.basePrice.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Search above to add products to this order
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Delivery</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-muted-foreground">
              Delivery address
            </label>
            <input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Street address, building, floor..."
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              County
            </label>
            <select
              value={deliveryCounty}
              onChange={(e) => setDeliveryCounty(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select county...</option>
              {KENYA_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Delivery method
            </label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="STANDARD_COURIER">Standard courier</option>
              <option value="EXPRESS_COURIER">Express courier</option>
              <option value="OWN_RIDER">Own rider (Eldoret)</option>
              <option value="CUSTOMER_PICKUP">Customer pickup (free)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Payment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="CASH_ON_PICKUP">Cash on pickup</option>
              <option value="MPESA_PAYBILL">M-Pesa Paybill (manual)</option>
              <option value="CARD_PESAPAL">Card (Pesapal)</option>
              {corporate && corporate.paymentTerms !== "PREPAID" && (
                <option value="NET_TERMS">
                  Invoice — {corporate.paymentTerms}
                </option>
              )}
            </select>
          </div>
          {corporate && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">
                PO Reference <span className="text-muted-foreground/70">(optional)</span>
              </label>
              <input
                value={poReference}
                onChange={(e) => setPoReference(e.target.value)}
                placeholder="e.g. PO-2026-0445"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-muted-foreground">
              Admin notes <span className="text-muted-foreground/70">(internal only)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this order for internal reference..."
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>
              Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && corporate && (
            <div className="flex justify-between text-primary">
              <span>Corporate discount ({corporate.discountPercent}%)</span>
              <span>-KES {discountAmount.toLocaleString()}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery fee</span>
              <span>KES {deliveryFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground/80">
            <span>VAT included (16%)</span>
            <span>KES {vatAmount.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <span>Total</span>
            <span>KES {total.toLocaleString()}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!customer || items.length === 0 || isSubmitting}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Creating order..." : "Create Order"}
        </button>
        {!customer && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Select a customer first
          </p>
        )}
        {customer && items.length === 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Add at least one product
          </p>
        )}
      </div>
    </div>
  );
}
