"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send");
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return <span className="text-xs text-green-600">Sent</span>;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-primary hover:underline h-auto py-1"
        onClick={handleSend}
        disabled={loading}
      >
        {loading ? "Sending…" : "Email to customer"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </>
  );
}
