"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader, type UploadedFileResult } from "@/components/upload/FileUploader";
import { formatPrice } from "@/lib/utils";
import { AlertCircle, Copy, Check, Loader2 } from "lucide-react";

const DEFAULT_PAYBILL = process.env.NEXT_PUBLIC_MPESA_PAYBILL ?? "522522";

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
  const [paybillNumber, setPaybillNumber] = useState(DEFAULT_PAYBILL);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [stkFailed, setStkFailed] = useState(false);
  const [polling, setPolling] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.mpesaPaybillNumber === "string" && data.mpesaPaybillNumber.trim()) {
          setPaybillNumber(data.mpesaPaybillNumber.trim());
        }
      })
      .catch(() => {});
  }, []);

  const [manualRef, setManualRef] = useState("");
  const [proofFile, setProofFile] = useState<UploadedFileResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const normalizePhone = (p: string) => {
    const cleaned = p.replace(/\D/g, "");
    if (cleaned.startsWith("254")) return cleaned;
    if (cleaned.startsWith("0")) return "254" + cleaned.slice(1);
    return "254" + cleaned;
  };

  const pollStatus = useCallback(
    (checkoutRequestId: string) => {
      let attempts = 0;
      const maxAttempts = 24; // 2 min at 5s
      const poll = async () => {
        try {
          const res = await fetch(
            `/api/payments/mpesa/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}&orderId=${encodeURIComponent(orderId)}`
          );
          const data = await res.json();
          if (data.status === "CONFIRMED") {
            setPolling(false);
            setPaymentReceived(true);
            setTimeout(() => router.push(`/order-confirmation/${orderId}`), 1500);
            return;
          }
          if (data.status === "FAILED") {
            setPolling(false);
            setStkFailed(true);
            return;
          }
          attempts++;
          if (attempts < maxAttempts) setTimeout(poll, 5000);
          else {
            setPolling(false);
            setStkFailed(true);
          }
        } catch {
          attempts++;
          if (attempts < maxAttempts) setTimeout(poll, 5000);
          else {
            setPolling(false);
            setStkFailed(true);
          }
        }
      };
      poll();
    },
    [orderId, router]
  );

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStkFailed(false);
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
      setPolling(true);
      pollStatus(data.checkoutRequestId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStkFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const submitManualPayment = async () => {
    if (!manualRef.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          method: "MPESA_PAYBILL",
          reference: manualRef.trim(),
          amountKes: totalKes,
          proofFileId: proofFile?.uploadId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      setPaymentReceived(true);
      setTimeout(() => router.push(`/order-confirmation/${orderId}`), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (paymentReceived) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-green-700">Payment received</h1>
          <p className="text-muted-foreground mt-2">Taking you to your order confirmation…</p>
        </div>
      </div>
    );
  }

  if (waiting && !stkFailed) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold">Complete payment on your phone</h1>
          <p className="text-muted-foreground mt-2">
            {polling
              ? "Checking payment status…"
              : `An M-Pesa prompt has been sent to your phone. Enter your PIN to complete payment for ${formatPrice(totalKes)}.`}
          </p>
          {polling && <Loader2 className="h-8 w-8 animate-spin mx-auto mt-4 text-muted-foreground" />}
          {!polling && (
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push(`/order-confirmation/${orderId}`)}
            >
              I’ve paid — continue
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (stkFailed) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">STK push didn’t go through</p>
                <p className="mt-0.5 text-sm text-amber-700">
                  Pay directly to our Paybill below, then enter your M-Pesa confirmation code.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
            <p className="font-semibold text-muted-foreground">On your phone: M-Pesa → Lipa na M-Pesa → Pay Bill</p>
            {[
              { label: "Business No.", value: paybillNumber, key: "paybill" },
              { label: "Account No.", value: orderNumber, key: "account" },
              { label: "Amount (KES)", value: String(totalKes), key: "amount" },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="font-mono font-bold">{row.value}</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => copy(row.value, row.key)}
                >
                  {copied === row.key ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === row.key ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground rounded-lg border border-blue-100 bg-blue-50 p-3">
            Use your <strong>order number ({orderNumber})</strong> as the account number so we can match your payment.
          </p>

          <div>
            <Label className="mb-1">Enter your M-Pesa confirmation code *</Label>
            <p className="mb-2 text-xs text-muted-foreground">e.g. RGH7X2K1LM — from the SMS M-Pesa sent you</p>
            <Input
              type="text"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value.toUpperCase())}
              placeholder="e.g. RGH7X2K1LM"
              className="font-mono uppercase max-w-xs"
              maxLength={12}
            />
          </div>

          <div>
            <Label className="mb-1 text-muted-foreground">Screenshot of M-Pesa SMS (optional)</Label>
            <FileUploader
              context="CUSTOMER_PAYMENT_PROOF"
              accept={["image/jpeg", "image/png", "application/pdf"]}
              maxSizeMB={10}
              maxFiles={1}
              orderId={orderId}
              onUploadComplete={([file]) => setProofFile(file ?? null)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            disabled={!manualRef.trim() || manualRef.length < 8 || submitting}
            onClick={submitManualPayment}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "I have paid — confirm my payment"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            We’ll verify your payment within 30 minutes (Mon–Fri 8am–6pm).
          </p>

          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setStkFailed(false);
              setError("");
            }}
          >
            Try STK push again
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
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send M-Pesa prompt"
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            If the prompt doesn’t arrive, you’ll be able to pay via Paybill and enter your code.
          </p>
        </form>
      </div>
    </div>
  );
}
