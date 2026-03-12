"use client";

import { useState } from "react";
import {
  Smartphone,
  CreditCard,
  Building2,
  Store,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader, type UploadedFileResult } from "@/components/upload/FileUploader";
import { formatPrice } from "@/lib/utils";

const DEFAULT_PAYBILL = "522522";

export interface PaymentStepOrder {
  id: string;
  orderNumber: string;
  totalKes: number;
}

export function PaymentStep({
  order,
  savedMpesaNumbers,
  savedCards,
  onPaymentComplete,
  paybillNumber = DEFAULT_PAYBILL,
}: {
  order: PaymentStepOrder;
  savedMpesaNumbers: { id: string; phone: string; label: string | null; isDefault: boolean }[];
  savedCards: { id: string; last4: string; brand: string; expiryMonth: number; expiryYear: number; holderName?: string | null; isDefault: boolean }[];
  onPaymentComplete: (payment: { id: string }) => void;
  /** From admin Settings → Payments (Paybill/Till). Default 522522. */
  paybillNumber?: string;
}) {
  const [method, setMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stkSent, setStkSent] = useState(false);
  const [stkFailed, setStkFailed] = useState(false);
  const [polling, setPolling] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState(
    savedMpesaNumbers.find((n) => n.isDefault)?.phone ?? ""
  );
  const [manualRef, setManualRef] = useState("");
  const [proofFile, setProofFile] = useState<UploadedFileResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sendStkPush = async () => {
    if (!mpesaPhone) return;
    setProcessing(true);
    setStkFailed(false);
    try {
      const res = await fetch("/api/payments/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phone: mpesaPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "STK failed");

      setStkSent(true);
      setPolling(true);
      pollPaymentStatus(data.checkoutRequestId);
    } catch {
      setStkFailed(true);
    } finally {
      setProcessing(false);
    }
  };

  const pollPaymentStatus = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 24;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/payments/mpesa/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}&orderId=${encodeURIComponent(order.id)}`
        );
        const data = await res.json();

        if (data.status === "CONFIRMED") {
          setPolling(false);
          onPaymentComplete(data.payment ?? { id: "" });
          return;
        }
        if (data.status === "FAILED") {
          setPolling(false);
          setStkSent(false);
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
      }
    };
    poll();
  };

  const submitManualPayment = async (paymentMethod: "MPESA_PAYBILL" | "MPESA_TILL") => {
    if (!manualRef.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          method: paymentMethod,
          reference: manualRef.trim(),
          amountKes: order.totalKes,
          proofFileId: proofFile?.uploadId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      onPaymentComplete(data.payment ?? { id: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const selectPickup = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onPaymentComplete(data.payment ?? { id: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const methods = [
    {
      id: "mpesa_stk",
      icon: Smartphone,
      label: "M-Pesa",
      desc: "STK push to your phone",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      id: "mpesa_paybill",
      icon: Building2,
      label: "Paybill / Till",
      desc: "Pay manually, enter reference",
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      id: "card",
      icon: CreditCard,
      label: "Card",
      desc: "Visa or Mastercard via Pesapal",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      id: "pickup",
      icon: Store,
      label: "Pay on Pickup",
      desc: "Pay cash when you collect",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Payment</h2>
      <p className="text-sm text-muted-foreground">
        Total: <span className="font-bold text-foreground">{formatPrice(order.totalKes)}</span>
      </p>

      <div className="grid grid-cols-2 gap-3">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMethod(m.id);
              setStkSent(false);
              setStkFailed(false);
              setManualRef("");
            }}
            className={`rounded-xl border-2 p-4 text-left transition ${
              method === m.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${m.bg}`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <p className="text-sm font-semibold text-foreground">{m.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
          </button>
        ))}
      </div>

      {method === "mpesa_stk" && (
        <div className="space-y-4 rounded-2xl border border-border p-5">
          {!stkSent && !polling && (
            <>
              <div>
                <Label className="mb-1">M-Pesa number</Label>
                {savedMpesaNumbers.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {savedMpesaNumbers.map((n) => (
                      <label
                        key={n.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-muted/50"
                      >
                        <input
                          type="radio"
                          name="mpesa_phone"
                          checked={mpesaPhone === n.phone}
                          onChange={() => setMpesaPhone(n.phone)}
                          className="accent-primary"
                        />
                        <span className="text-sm font-medium">{n.phone}</span>
                        <span className="text-xs text-muted-foreground">{n.label}</span>
                        {n.isDefault && (
                          <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">
                            Default
                          </span>
                        )}
                      </label>
                    ))}
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-muted/50">
                      <input
                        type="radio"
                        name="mpesa_phone"
                        checked={!savedMpesaNumbers.some((n) => n.phone === mpesaPhone)}
                        onChange={() => setMpesaPhone("")}
                        className="accent-primary"
                      />
                      <span className="text-sm text-muted-foreground">Use a different number</span>
                    </label>
                  </div>
                )}
                {(!savedMpesaNumbers.some((n) => n.phone === mpesaPhone) || savedMpesaNumbers.length === 0) && (
                  <Input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="mt-1"
                  />
                )}
              </div>

              <Button
                className="w-full"
                disabled={processing || !mpesaPhone}
                onClick={sendStkPush}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "📱 Send M-Pesa request"
                )}
              </Button>
            </>
          )}

          {(stkSent || polling) && !stkFailed && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
              <p className="font-semibold text-foreground">Check your phone</p>
              <p className="mt-1 text-sm text-muted-foreground">
                An M-Pesa payment request has been sent to <span className="font-medium">{mpesaPhone}</span>. Enter your PIN to complete.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">Waiting for confirmation...</p>
              <Button
                variant="link"
                className="mt-4 text-xs text-muted-foreground"
                onClick={() => {
                  setStkSent(false);
                  setStkFailed(true);
                }}
              >
                Didn&apos;t receive it? Pay manually instead
              </Button>
            </div>
          )}

          {stkFailed && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">STK push didn&apos;t go through</p>
                    <p className="mt-0.5 text-sm text-amber-700">
                      Pay directly to our Paybill below, then enter your M-Pesa confirmation code.
                    </p>
                  </div>
                </div>
              </div>

              <PaybillInstructions
                orderNumber={order.orderNumber}
                amount={order.totalKes}
                paybillNumber={paybillNumber}
                setProofFile={setProofFile}
                orderId={order.id}
                onReferenceSubmit={(ref) => {
                  setManualRef(ref);
                  submitManualPayment("MPESA_PAYBILL");
                }}
                submitting={submitting}
              />

              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setStkSent(false);
                  setStkFailed(false);
                }}
              >
                Try STK push again
              </Button>
            </div>
          )}
        </div>
      )}

      {method === "mpesa_paybill" && (
        <div className="rounded-2xl border border-border p-5">
          <PaybillInstructions
            orderNumber={order.orderNumber}
            amount={order.totalKes}
            paybillNumber={paybillNumber}
            setProofFile={setProofFile}
            orderId={order.id}
            onReferenceSubmit={(ref) => {
              setManualRef(ref);
              submitManualPayment("MPESA_PAYBILL");
            }}
            submitting={submitting}
          />
        </div>
      )}

      {method === "card" && (
        <div className="space-y-4 rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">
            You&apos;ll be redirected to Pesapal&apos;s secure payment page. Your card number is never stored on our servers.
          </p>
          {savedCards.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Saved cards:</p>
              {savedCards.map((card) => (
                <label
                  key={card.id}
                  className="mb-2 flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                >
                  <input type="radio" name="card" className="accent-primary" />
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {card.brand} •••• {card.last4}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {card.expiryMonth}/{card.expiryYear}
                  </span>
                </label>
              ))}
            </div>
          )}
          <Button
            className="w-full"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              const res = await fetch("/api/payments/pesapal/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
              });
              const data = await res.json();
              if (data.redirectUrl) window.location.href = data.redirectUrl;
              setSubmitting(false);
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with Card via Pesapal
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">🔒 Secured by Pesapal</p>
        </div>
      )}

      {method === "pickup" && (
        <div className="space-y-4 rounded-2xl border border-border p-5">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">📍 How Pay on Pickup works:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-amber-700">
              <li>We prepare your order and notify you when it&apos;s ready</li>
              <li>You collect from our Nairobi studio</li>
              <li>Pay by M-Pesa or cash when you arrive</li>
              <li>Show your order number: <strong>{order.orderNumber}</strong></li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            📍 Collection address: PrintHub Studio, Nairobi (exact address sent when order is ready)
          </p>
          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            ℹ️ Your order will only be processed after you confirm. We&apos;ll contact you before printing begins.
          </p>
          <Button
            className="w-full"
            disabled={submitting}
            onClick={selectPickup}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Store className="mr-2 h-4 w-4" />
                Confirm — I&apos;ll pay on pickup
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function PaybillInstructions({
  orderNumber,
  amount,
  paybillNumber,
  setProofFile,
  orderId,
  onReferenceSubmit,
  submitting,
}: {
  orderNumber: string;
  amount: number;
  paybillNumber: string;
  setProofFile: (f: UploadedFileResult | null) => void;
  orderId: string;
  onReferenceSubmit: (ref: string) => void;
  submitting: boolean;
}) {
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-muted-foreground">Follow these steps on your phone:</p>
      <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
        <p className="text-muted-foreground">
          Open M-Pesa → <strong>Lipa na M-Pesa</strong> → <strong>Pay Bill</strong>
        </p>
        {[
          { label: "Business No.", value: paybillNumber, key: "paybill" },
          { label: "Account No.", value: orderNumber, key: "account" },
          { label: "Amount (KES)", value: String(amount), key: "amount" },
        ].map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <div>
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="font-mono font-bold text-foreground">{row.value}</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-primary"
              onClick={() => copy(row.value, row.key)}
            >
              {copied === row.key ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-muted-foreground">
        💡 Use your <strong>order number ({orderNumber})</strong> as the account number so we can match your payment.
      </p>

      <div>
        <Label className="mb-1">Enter your M-Pesa confirmation code *</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          e.g. <span className="font-mono">RGH7X2K1LM</span> — from the SMS M-Pesa sent you
        </p>
        <Input
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value.toUpperCase())}
          placeholder="e.g. RGH7X2K1LM"
          className="font-mono uppercase"
          maxLength={12}
        />
      </div>

      <div>
        <Label className="mb-1 text-muted-foreground">
          Screenshot of M-Pesa SMS <span className="text-muted-foreground/70">(optional)</span>
        </Label>
        <FileUploader
          context="CUSTOMER_PAYMENT_PROOF"
          accept={["image/jpeg", "image/png", "application/pdf"]}
          maxSizeMB={10}
          maxFiles={1}
          orderId={orderId}
          onUploadComplete={([file]) => setProofFile(file ?? null)}
        />
      </div>

      <Button
        className="w-full"
        disabled={!ref || ref.length < 8 || submitting}
        onClick={() => onReferenceSubmit(ref)}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "✓ I have paid — confirm my payment"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Our team will verify your payment within 30 minutes (Mon–Fri 8am–6pm)
      </p>
    </div>
  );
}
