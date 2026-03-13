"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function RefundActionsClient({
  refundId,
  status,
  orderNumber,
}: {
  refundId: string;
  status: string;
  orderNumber: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [b2cOpen, setB2cOpen] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");

  const approve = async () => {
    setLoading("approve");
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setLoading(null);
    }
  };

  const reject = async () => {
    setLoading("reject");
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectionReason.trim() || undefined }),
      });
      if (res.ok) {
        setRejectOpen(false);
        setRejectionReason("");
        window.location.reload();
      }
    } finally {
      setLoading(null);
    }
  };

  const processB2c = async () => {
    if (!mpesaPhone.trim()) return;
    setLoading("b2c");
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}/process-b2c`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpesaPhone: mpesaPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setB2cOpen(false);
        setMpesaPhone("");
        window.location.reload();
      } else {
        alert(data.error ?? "B2C request failed");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {status === "PENDING" && (
          <>
            <Button size="sm" variant="default" onClick={approve} disabled={!!loading}>
              {loading === "approve" ? "…" : "Approve"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} disabled={!!loading}>
              Reject
            </Button>
          </>
        )}
        {status === "APPROVED" && (
          <Button size="sm" variant="secondary" onClick={() => setB2cOpen(true)} disabled={!!loading}>
            {loading === "b2c" ? "…" : "Send via M-Pesa"}
          </Button>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject refund</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Order {orderNumber}. Optional reason:</p>
          <Input
            placeholder="Reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={loading === "reject"}>
              {loading === "reject" ? "…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={b2cOpen} onOpenChange={setB2cOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send refund via M-Pesa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Order {orderNumber}. Enter customer M-Pesa number:</p>
          <Input
            type="tel"
            placeholder="+254 7XX XXX XXX"
            value={mpesaPhone}
            onChange={(e) => setMpesaPhone(e.target.value)}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setB2cOpen(false)}>Cancel</Button>
            <Button onClick={processB2c} disabled={loading === "b2c" || !mpesaPhone.trim()}>
              {loading === "b2c" ? "…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
