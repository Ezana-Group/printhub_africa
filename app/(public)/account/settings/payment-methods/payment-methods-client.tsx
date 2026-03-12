"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  CreditCard,
  Plus,
  Trash2,
  Star,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";

export function PaymentMethodsClient() {
  const [mpesaNumbers, setMpesaNumbers] = useState<
    { id: string; phone: string; label: string | null; isDefault: boolean }[]
  >([]);
  const [savedCards, setSavedCards] = useState<
    {
      id: string;
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
      holderName: string | null;
      isDefault: boolean;
    }[]
  >([]);
  const [showAddMpesa, setShowAddMpesa] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [mpesaRes, cardsRes] = await Promise.all([
      fetch("/api/account/payment-methods/mpesa"),
      fetch("/api/account/payment-methods/cards"),
    ]);
    const [mpesaData, cardsData] = await Promise.all([
      mpesaRes.json(),
      cardsRes.json(),
    ]);
    setMpesaNumbers(mpesaData.numbers ?? []);
    setSavedCards(cardsData.cards ?? []);
    setLoading(false);
  };

  const addMpesa = async () => {
    if (!phoneInput) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/account/payment-methods/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneInput,
          label: labelInput || "My M-Pesa",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add number");
      setMpesaNumbers((prev) => [...prev, data.number]);
      setShowAddMpesa(false);
      setPhoneInput("");
      setLabelInput("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  const removeMpesa = async (id: string) => {
    if (!confirm("Remove this M-Pesa number?")) return;
    await fetch("/api/account/payment-methods/mpesa", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMpesaNumbers((prev) => prev.filter((n) => n.id !== id));
  };

  const setDefaultMpesa = async (id: string) => {
    await fetch("/api/account/payment-methods/mpesa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMpesaNumbers((prev) =>
      prev.map((n) => ({ ...n, isDefault: n.id === id }))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionCard
        title="M-Pesa Numbers"
        description="Saved for one-tap payments. Max 2 numbers."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {mpesaNumbers.length < 2 && !showAddMpesa && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddMpesa(true)}
              className="border-primary text-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add number
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {mpesaNumbers.map((num) => (
            <div
              key={num.id}
              className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{num.phone}</p>
                  {num.isDefault && (
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">
                      Default
                    </span>
                  )}
                </div>
                {num.label && (
                  <p className="text-xs text-muted-foreground">{num.label}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!num.isDefault && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Set as default"
                    onClick={() => setDefaultMpesa(num.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMpesa(num.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {mpesaNumbers.length === 0 && !showAddMpesa && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No M-Pesa numbers saved yet.
            </p>
          )}
          {showAddMpesa && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  M-Pesa number *
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setError("");
                  }}
                  placeholder="0712 345 678"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="e.g. My number, Work, Spouse"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {error && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <X className="h-3 w-3" />
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddMpesa(false);
                    setError("");
                    setPhoneInput("");
                    setLabelInput("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={adding || !phoneInput.trim()}
                  onClick={addMpesa}
                >
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save number
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Saved Cards"
        description="Visa/Mastercard via Pesapal. No raw card data stored. Max 3."
      >
        {savedCards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved cards yet. Cards are tokenised securely via Pesapal.
          </p>
        ) : (
          <div className="space-y-3">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {card.brand} •••• {card.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {card.expiryMonth}/{card.expiryYear}
                    {card.holderName && ` · ${card.holderName}`}
                  </p>
                </div>
                {card.isDefault && (
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {savedCards.length < 3 && (
          <Button type="button" variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/account/settings/payment-methods/add-card">
              <Plus className="h-4 w-4 mr-1.5" />
              Add card
            </Link>
          </Button>
        )}
      </SectionCard>
    </div>
  );
}
