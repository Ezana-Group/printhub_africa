"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";

const REASONS = [
  { value: "out_of_stock", label: "Out of stock" },
  { value: "technical_issue", label: "Technical issue" },
  { value: "customer_request", label: "Customer request" },
  { value: "pricing_error", label: "Pricing error" },
  { value: "material_unavailable", label: "Material unavailable" },
  { value: "other", label: "Other" },
] as const;

export function AdminQuoteCancelRestore({
  quoteId,
  quoteNumber,
  status,
  cancellationReason,
  cancellationNotes,
  cancelledByAdminName,
  onCancelled,
  onRestored,
}: {
  quoteId: string;
  quoteNumber: string;
  status: string;
  cancellationReason?: string | null;
  cancellationNotes?: string | null;
  cancelledByAdminName?: string | null;
  onCancelled?: () => void;
  onRestored?: () => void;
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const isCancelled = status === "cancelled";
  const canCancel = ["new", "reviewing", "quoted", "accepted", "in_production"].includes(status);

  const reasonLabel = (r: string) => REASONS.find((x) => x.value === r)?.label ?? r;

  async function handleCancel() {
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          notes: notes.trim() || undefined,
          notify_customer: notifyCustomer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setShowCancelModal(false);
      setReason("");
      setNotes("");
      onCancelled?.();
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to cancel quote");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setRestoreLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to restore");
      onRestored?.();
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to restore quote");
    } finally {
      setRestoreLoading(false);
    }
  }

  if (isCancelled) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <h2 className="font-semibold text-amber-900">Quote cancelled</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800">
          <p>
            Reason: {reasonLabel(cancellationReason ?? "")}
            {cancelledByAdminName && ` · By ${cancelledByAdminName}`}
          </p>
          {cancellationNotes && <p className="whitespace-pre-wrap">{cancellationNotes}</p>}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
            disabled={restoreLoading}
            onClick={handleRestore}
          >
            {restoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restore quote"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!canCancel) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Actions</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showCancelModal ? (
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel quote
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Cancel {quoteNumber}</span>
            </div>
            <div>
              <Label className="text-xs">Reason *</Label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select reason...</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                maxLength={1000}
                className="mt-1 min-h-[80px] resize-y"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
              />
              Notify customer by email
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setReason("");
                  setNotes("");
                }}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!reason || loading}
                onClick={handleCancel}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel quote"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
