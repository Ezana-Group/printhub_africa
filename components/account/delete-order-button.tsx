"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const CANCELABLE_STATUSES = ["PENDING", "CONFIRMED"];

export function DeleteOrderButton({
  orderId,
  orderNumber,
  status,
  variant = "outline",
  size = "sm",
  className,
  onDeleted,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
  variant?: "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "icon";
  className?: string;
  onDeleted?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const canDelete = CANCELABLE_STATUSES.includes(status.toUpperCase());

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancelReason: "Deleted by customer" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Could not delete order");
        setConfirming(false);
        return;
      }
      onDeleted?.();
      router.refresh();
    } catch {
      alert("Something went wrong");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (!canDelete) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className ?? "rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"}
      onClick={handleDelete}
      disabled={loading}
      aria-label={`Delete order ${orderNumber}`}
    >
      {loading ? (
        "Deleting…"
      ) : confirming ? (
        "Click again to confirm"
      ) : (
        <>
          <Trash2 className="h-4 w-4 mr-1" aria-hidden />
          Delete
        </>
      )}
    </Button>
  );
}
