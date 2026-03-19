"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Lock } from "lucide-react";

const REASONS = [
  { value: "unable_to_fulfil", label: "Unable to fulfil — material or equipment not available" },
  { value: "file_quality", label: "File quality issue — customer submitted unusable files" },
  { value: "no_response", label: "No customer response — quote expired without reply" },
  { value: "pricing_dispute", label: "Pricing dispute — customer rejected final price" },
  { value: "duplicate", label: "Duplicate submission — customer submitted same request twice" },
  { value: "policy_violation", label: "Policy violation — content not permitted for printing" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "technical_issue", label: "Technical issue" },
  { value: "customer_request", label: "Customer request" },
  { value: "pricing_error", label: "Pricing error" },
  { value: "material_unavailable", label: "Material unavailable" },
  { value: "custom", label: "Other reason (specify below)" },
] as const;

export function AdminQuoteCancelRestore({
  quoteId,
  quoteNumber,
  status,
  cancellationReason,
  cancellationNotes,
  cancelledByAdminName,
  closedBy,
  onCancelled,
  onRestored,
}: {
  quoteId: string;
  quoteNumber: string;
  status: string;
  cancellationReason?: string | null;
  cancellationNotes?: string | null;
  cancelledByAdminName?: string | null;
  closedBy?: string | null;
  onCancelled?: () => void;
  onRestored?: () => void;
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [messageToCustomer, setMessageToCustomer] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const isCancelled = status === "cancelled";
  const canCancel = ["new", "reviewing", "quoted", "accepted", "in_production"].includes(status);

  const reasonLabel = (r: string) => REASONS.find((x) => x.value === r)?.label ?? r;

  async function handleCancel() {
    if (!reason) return;
    if (reason === "custom" && !customReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          notes: notes.trim() || undefined,
          custom_reason: reason === "custom" ? customReason.trim() : undefined,
          message_to_customer: messageToCustomer.trim() || undefined,
          notify_customer: notifyCustomer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setShowCancelModal(false);
      setReason("");
      setCustomReason("");
      setNotes("");
      setMessageToCustomer("");
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
    const customerClosed = closedBy === "CUSTOMER";
    return (
      <Card className={customerClosed ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/50"}>
        <CardHeader>
          <h2 className="font-semibold text-amber-900">Quote cancelled</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800">
          <p>
            Reason: {reasonLabel(cancellationReason ?? "")}
            {cancelledByAdminName && ` · By ${cancelledByAdminName}`}
          </p>
          {cancellationNotes && <p className="whitespace-pre-wrap">{cancellationNotes}</p>}
          {customerClosed ? (
            <p className="flex items-center gap-1.5 mt-2 text-red-700 text-xs">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Closed by customer — cannot be restored. Customer must submit a new quote to reopen.
            </p>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
              disabled={restoreLoading}
              onClick={handleRestore}
            >
              {restoreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restore quote"}
            </Button>
          )}
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
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
          onClick={() => setShowCancelModal(true)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Cancel this quote
        </Button>
      </CardContent>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Quote</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Cancelling <strong>{quoteNumber}</strong> will notify the customer by email. This action cannot be undone.
          </p>

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              Reason for cancellation <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    reason === r.value
                      ? "border-red-300 bg-red-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-0.5 accent-red-500"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === "custom" && (
            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">Describe the reason</Label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the reason for cancellation..."
                rows={3}
                className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-200"
              />
            </div>
          )}

          <div>
            <Label className="mb-1 block text-sm font-medium text-gray-700">
              Message to customer (optional)
            </Label>
            <Textarea
              value={messageToCustomer}
              onChange={(e) => setMessageToCustomer(e.target.value)}
              placeholder="Add a personal note that will appear in the cancellation email..."
              rows={2}
              className="w-full rounded-xl border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-red-200"
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            The customer will receive an email with the reason and any message you add above.
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
            />
            Notify customer by email
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCancelModal(false);
                setReason("");
                setCustomReason("");
                setNotes("");
                setMessageToCustomer("");
              }}
            >
              Go back
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={!reason || loading || (reason === "custom" && !customReason.trim())}
              onClick={handleCancel}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel quote & notify customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
