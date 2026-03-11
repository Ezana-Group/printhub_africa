"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function QuoteAcceptDecline({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  async function handleAccept() {
    setLoading("accept");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setLoading(null);
    }
  }

  async function handleDecline() {
    setLoading("decline");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-3 pt-2">
      <Button
        onClick={handleAccept}
        disabled={loading !== null}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {loading === "accept" ? "Accepting…" : "Accept quote"}
      </Button>
      <Button
        variant="outline"
        onClick={handleDecline}
        disabled={loading !== null}
      >
        {loading === "decline" ? "Declining…" : "Decline"}
      </Button>
    </div>
  );
}
