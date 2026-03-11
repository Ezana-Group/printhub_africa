"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
};

export function CouponList({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (coupons.length === 0) {
    return <p className="text-muted-foreground text-sm">No coupons yet. Create one above.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-2 font-medium">Code</th>
            <th className="text-left p-2 font-medium">Type</th>
            <th className="text-left p-2 font-medium">Value</th>
            <th className="text-left p-2 font-medium">Used</th>
            <th className="text-left p-2 font-medium">Expires</th>
            <th className="text-left p-2 font-medium">Active</th>
            <th className="text-left p-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} className="border-b hover:bg-muted/30">
              <td className="p-2 font-mono">{c.code}</td>
              <td className="p-2">{c.type.replace("_", " ")}</td>
              <td className="p-2">
                {c.type === "PERCENTAGE" ? `${c.value}%` : `KES ${c.value}`}
                {c.minOrderAmount != null && c.minOrderAmount > 0 && (
                  <span className="text-muted-foreground text-xs block">min {c.minOrderAmount} KES</span>
                )}
              </td>
              <td className="p-2">{c.usedCount} / {c.maxUses ?? "∞"}</td>
              <td className="p-2 text-muted-foreground">
                {new Date(c.expiryDate).toLocaleDateString()}
              </td>
              <td className="p-2">{c.isActive ? "Yes" : "No"}</td>
              <td className="p-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c.id)}
                >
                  {deletingId === c.id ? "…" : "Delete"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
