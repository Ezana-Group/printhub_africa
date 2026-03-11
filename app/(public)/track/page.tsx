import { Suspense } from "react";
import { TrackPageClient } from "./track-page-client";

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl mx-auto px-4 py-10">
          <h1 className="font-display text-3xl font-bold text-slate-900">
            Track Your Order
          </h1>
          <p className="text-slate-600 mt-1">
            Enter your order number or the email you used to order.
          </p>
          <div className="mt-6 h-12 rounded-md bg-slate-100 animate-pulse" />
        </div>
      }
    >
      <TrackPageClient />
    </Suspense>
  );
}
