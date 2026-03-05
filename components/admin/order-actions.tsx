"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PRINTING",
  "QUALITY_CHECK",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
  orderTotal: number;
  totalPaid: number;
}

export function OrderActions({
  orderId,
  currentStatus,
  orderTotal,
  totalPaid,
}: OrderActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [statusLoading, setStatusLoading] = useState(false);
  const [timelineMessage, setTimelineMessage] = useState("");
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const handleStatusChange = async () => {
    if (status === currentStatus) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch {
      setStatusLoading(false);
    }
    setStatusLoading(false);
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineMessage.trim()) return;
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timelineMessage: timelineMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setTimelineMessage("");
      router.refresh();
    } catch {
      // ignore
    }
    setTimelineLoading(false);
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError(null);
    const amount = parseFloat(refundAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setRefundError("Enter a valid amount");
      return;
    }
    if (amount > totalPaid) {
      setRefundError(`Amount cannot exceed paid total (${totalPaid.toLocaleString()} KES)`);
      return;
    }
    setRefundLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: refundReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.amount?.[0] ?? data.error ?? "Refund failed");
      setRefundAmount("");
      setRefundReason("");
      router.refresh();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : "Refund failed");
    }
    setRefundLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Update status</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-sm">Order status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="ml-2 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            disabled={status === currentStatus || statusLoading}
            onClick={handleStatusChange}
          >
            {statusLoading ? "Updating..." : "Update status"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Add timeline event</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTimeline} className="flex gap-2">
            <Input
              value={timelineMessage}
              onChange={(e) => setTimelineMessage(e.target.value)}
              placeholder="e.g. Dispatched via courier"
              className="max-w-md"
            />
            <Button type="submit" size="sm" disabled={!timelineMessage.trim() || timelineLoading}>
              {timelineLoading ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {totalPaid > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Refund</h2>
            <p className="text-sm text-muted-foreground">
              Total paid: {totalPaid.toLocaleString()} KES. Order total: {orderTotal.toLocaleString()} KES.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRefund} className="space-y-3 max-w-sm">
              <div>
                <Label htmlFor="refundAmount">Amount (KES)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="refundReason">Reason (optional)</Label>
                <Input
                  id="refundReason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Customer request"
                  className="mt-1"
                />
              </div>
              {refundError && (
                <p className="text-sm text-destructive">{refundError}</p>
              )}
              <Button type="submit" variant="secondary" disabled={refundLoading}>
                {refundLoading ? "Processing..." : "Request refund"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
