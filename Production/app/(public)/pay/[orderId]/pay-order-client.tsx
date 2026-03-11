"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

export function PayOrderClient({
  orderId,
  orderNumber,
  totalKes,
}: {
  orderId: string;
  orderNumber: string;
  totalKes: number;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");

  const normalizePhone = (p: string) => {
    const cleaned = p.replace(/\D/g, "");
    if (cleaned.startsWith("254")) return cleaned;
    if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
    return "254" + cleaned;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalized = normalizePhone(phone);
    if (normalized.length < 9) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setWaiting(true);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (waiting) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold">Complete payment on your phone</h1>
          <p className="text-muted-foreground mt-2">
            An M-Pesa prompt has been sent to your phone. Enter your PIN to complete payment for{" "}
            {formatPrice(totalKes)}.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push(`/order-confirmation/${orderId}`)}
          >
            I’ve paid — continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Pay for order {orderNumber}</h1>
          <p className="text-2xl font-bold mt-2">{formatPrice(totalKes)}</p>
        </div>
        <form onSubmit={handlePay} className="space-y-4">
          <div>
            <Label htmlFor="phone">M-Pesa phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send M-Pesa prompt"}
          </Button>
        </form>
      </div>
    </div>
  );
}
