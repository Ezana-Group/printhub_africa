"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type QueueItem = {
  id: string;
  orderId: string;
  orderItemId: string;
  orderNumber: string | null;
  productName: string | null;
  quantity: number | null;
  status: string;
  assignedTo: string | null;
  startedAt: string | null;
  completedAt: string | null;
  machineId: string | null;
  notes: string | null;
};

const COLUMNS = ["Queued", "In Progress", "Printing", "Quality Check", "Done"];

export function ProductionKanbanClient() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchItems = () => {
    setLoading(true);
    fetch("/api/admin/production-queue")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const moveStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/production-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchItems();
    } finally {
      setUpdating(null);
    }
  };

  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = items.filter((i) => i.status === col);
    return acc;
  }, {} as Record<string, QueueItem[]>);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading production queue…</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => (
          <div key={col} className="w-72 shrink-0">
            <Card>
              <CardHeader className="py-3">
                <h3 className="font-semibold text-sm">
                  {col}
                  <span className="ml-2 text-muted-foreground">({(byStatus[col] ?? []).length})</span>
                </h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 min-h-[120px]">
                {(byStatus[col] ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No jobs</p>
                ) : (
                  (byStatus[col] ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border bg-card p-3 text-sm"
                    >
                      <Link href={`/admin/orders/${item.orderId}`} className="font-mono text-primary hover:underline">
                        {item.orderNumber ?? item.orderId.slice(0, 8)}
                      </Link>
                      <p className="font-medium mt-0.5">{item.productName ?? "Item"}</p>
                      {item.quantity != null && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {COLUMNS.filter((c) => c !== item.status).map((s) => (
                          <Button
                            key={s}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            disabled={updating === item.id}
                            onClick={() => moveStatus(item.id, s)}
                          >
                            → {s}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-muted-foreground text-sm mt-4">
          No jobs in the production queue. Add print order items to the queue from the order detail page (Print Jobs tab).
        </p>
      )}
    </div>
  );
}
