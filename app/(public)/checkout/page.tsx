"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type Step = "info" | "shipping" | "payment" | "complete";

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("info");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaWaiting, setMpesaWaiting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    city: "",
    county: "",
    postalCode: "",
    deliveryMethod: "Standard",
  });

  const subtotal = 2500;
  const tax = Math.round(subtotal * 0.16);
  const shipping = 300;
  const total = subtotal + tax + shipping;

  const handleCreateOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: null, quantity: 1, unitPrice: subtotal }],
          shippingAddress: {
            fullName: `${form.firstName} ${form.lastName}`,
            email: form.email,
            phone: form.phone,
            street: form.street,
            city: form.city,
            county: form.county,
            postalCode: form.postalCode,
            deliveryMethod: form.deliveryMethod,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setOrderId(data.order.id);
      setOrderNumber(data.order.orderNumber);
      setStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaPay = async () => {
    if (!orderId || !mpesaPhone) return;
    setMpesaWaiting(true);
    setError("");
    try {
      const res = await fetch("/api/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone: mpesaPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "M-Pesa failed");
      const checkoutId = data.checkoutRequestId;
      let pollCount = 0;
      const maxPolls = 24;
      const interval = setInterval(async () => {
        pollCount++;
        const q = await fetch("/api/payments/mpesa/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutRequestId: checkoutId }),
        });
        const qData = await q.json();
        if (qData.status === "COMPLETED") {
          clearInterval(interval);
          setMpesaWaiting(false);
          setStep("complete");
          return;
        }
        if (qData.status === "FAILED" || pollCount >= maxPolls) {
          clearInterval(interval);
          setMpesaWaiting(false);
          setError(qData.message ?? "Payment timed out. Please try again.");
        }
      }, 5000);
    } catch (e) {
      setMpesaWaiting(false);
      setError(e instanceof Error ? e.message : "M-Pesa failed");
    }
  };

  if (step === "complete") {
    return (
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto text-center">
        <h1 className="font-display text-2xl font-bold text-success">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">Order {orderNumber}</p>
        <p className="mt-4">Thank you for your payment. We&apos;ll process your order shortly.</p>
        <Button asChild className="mt-8">
          <Link href="/">Continue shopping</Link>
        </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold">Checkout</h1>
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <div>
          {step === "info" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Contact & Shipping</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First name</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Phone (M-Pesa)</Label>
                  <Input
                    placeholder="07XX XXX XXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Street</Label>
                  <Input
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>County</Label>
                    <Input
                      value={form.county}
                      onChange={(e) => setForm({ ...form, county: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateOrder}
                  disabled={loading || !form.email || !form.phone || !form.street}
                >
                  {loading ? "Creating order…" : "Continue to payment"}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "payment" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Pay with M-Pesa</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your M-Pesa number. You&apos;ll receive a prompt on your phone.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
                )}
                <div>
                  <Label>M-Pesa phone number</Label>
                  <Input
                    placeholder="07XX XXX XXX"
                    value={mpesaPhone || form.phone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    disabled={mpesaWaiting}
                  />
                </div>
                <Button
                  className="w-full bg-primary"
                  onClick={handleMpesaPay}
                  disabled={mpesaWaiting || !(mpesaPhone || form.phone)}
                >
                  {mpesaWaiting ? (
                    <>Check your phone for the M-Pesa prompt&hellip;</>
                  ) : (
                    <>Pay {formatPrice(total)} via M-Pesa</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  256-bit SSL Secured Payments
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Order summary</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (16%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Prices include 16% VAT</p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
