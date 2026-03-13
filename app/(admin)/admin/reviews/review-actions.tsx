"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ReviewActions({ reviewId, isApproved }: { reviewId: string; isApproved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const update = async (approved: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approved }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this review?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 shrink-0">
      {!isApproved && (
        <Button size="sm" className="rounded-lg bg-green-600 hover:bg-green-700" disabled={loading} onClick={() => update(true)}>
          Approve
        </Button>
      )}
      {isApproved && (
        <Button size="sm" variant="outline" disabled={loading} onClick={() => update(false)}>
          Unapprove
        </Button>
      )}
      <Button size="sm" variant="destructive" className="rounded-lg" disabled={loading} onClick={remove}>
        Delete
      </Button>
    </div>
  );
}
