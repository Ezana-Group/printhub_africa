"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: { name: string; slug: string };
  licenseType: string;
  photos: { url: string }[];
}

export function AdminCatalogueQueueClient({ className }: { className?: string }) {
  const [data, setData] = useState<{ pendingReview: PendingItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/catalogue/queue")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ pendingReview: [] }))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LIVE" }),
    });
    if (res.ok) {
      setData((d) => ({
        pendingReview: d?.pendingReview.filter((i) => i.id !== id) ?? [],
      }));
    }
  };

  if (loading) return <Skeleton className={`h-48 rounded-xl ${className ?? ""}`} />;

  const pending = data?.pendingReview ?? [];
  if (pending.length === 0) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center text-slate-600 ${className ?? ""}`}>
        No items awaiting review.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <p className="text-sm text-slate-600">{pending.length} item(s) awaiting review</p>
      {pending.map((item) => (
        <div
          key={item.id}
          className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-slate-100">
            {item.photos?.[0]?.url ? (
              <Image src={item.photos[0].url} alt="" fill className="object-cover" sizes="96px" />
            ) : (
              <span className="flex h-full items-center justify-center text-slate-400 text-xs">No photo</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{item.name}</span>
              <Badge variant="secondary" className="rounded-md">PENDING REVIEW</Badge>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              {item.category.name} · {item.licenseType.replace("_", " ")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl" onClick={() => handleApprove(item.id)}>
              Approve — Set Live
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl">
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
