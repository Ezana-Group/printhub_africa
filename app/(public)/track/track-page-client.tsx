"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrackForm } from "./track-form";
import { TrackResult } from "./track-result";

const DEFAULT_WHATSAPP = "254700000000";

export function TrackPageClient({ whatsapp }: { whatsapp?: string | null } = {}) {
  const digits = (whatsapp ?? DEFAULT_WHATSAPP).replace(/\D/g, "") || DEFAULT_WHATSAPP;
  const waHref = `https://wa.me/${digits}`;
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order") ?? "";
  const [result, setResult] = useState<{
    order: {
      orderNumber: string;
      status: string;
      placedAt: string;
      itemCount: number;
      total: number;
      estimatedDelivery: string | null;
      deliveryType: string;
    };
    events: Array<{
      status: string;
      title: string;
      description: string | null;
      location: string | null;
      courierRef: string | null;
      createdAt: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-slate-900">
        Track Your Order
      </h1>
      <p className="text-slate-600 mt-1">
        Enter your order number or the email you used to order.
      </p>

      <TrackForm
        initialOrder={orderParam}
        onSearch={async (order, email) => {
          setError(null);
          setLoading(true);
          try {
            const params = new URLSearchParams();
            if (order) params.set("order", order);
            if (email) params.set("email", email);
            const res = await fetch(`/api/track?${params}`);
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Failed to load order");
              setResult(null);
              return;
            }
            setResult(data);
          } catch {
            setError("Something went wrong. Try again.");
            setResult(null);
          } finally {
            setLoading(false);
          }
        }}
        loading={loading}
      />

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-amber-50 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {result && <TrackResult data={result} />}

      <p className="mt-8 text-sm text-slate-500">
        Need help?{" "}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          WhatsApp us
        </a>{" "}
        with your order number.
      </p>
    </div>
  );
}
