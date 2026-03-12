"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PIPELINE = ["new", "reviewing", "quoted", "accepted", "in_production", "completed"] as const;
const PIPELINE_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  quoted: "Quoted",
  accepted: "Accepted",
  in_production: "In Production",
  completed: "Completed",
};

export function QuoteDetailClient({
  quoteId,
  quoteNumber,
  currentStatus,
  assignedStaffId,
  quotedAmount,
  quoteBreakdown,
  quoteValidityDays,
  quotePdfUrl,
  notes,
  adminNotes,
  staffList,
  createdAt,
  quotedAt,
  deadline,
  customerEstimateLow,
  customerEstimateHigh,
  deadlineHint,
}: {
  quoteId: string;
  quoteNumber: string;
  currentStatus: string;
  assignedStaffId: string | null;
  quotedAmount: number | null;
  quoteBreakdown: string | null;
  quoteValidityDays: number | null;
  quotePdfUrl: string | null;
  notes: string | null;
  adminNotes: string | null;
  staffList: { id: string; name: string; email: string }[];
  createdAt: string;
  quotedAt: string | null;
  deadline: string | null;
  customerEstimateLow?: number | null;
  customerEstimateHigh?: number | null;
  deadlineHint?: string | null;
}) {
  void quoteNumber;
  void notes;
  const [status, setStatus] = useState(currentStatus);
  const [assignedTo, setAssignedTo] = useState(assignedStaffId ?? "");
  const [amount, setAmount] = useState(quotedAmount?.toString() ?? "");
  const [breakdown, setBreakdown] = useState(quoteBreakdown ?? "");
  const [validityDays, setValidityDays] = useState(quoteValidityDays?.toString() ?? "7");
  const [internalNote, setInternalNote] = useState(adminNotes ?? "");
  const [deadlineValue, setDeadlineValue] = useState(deadline ? deadline.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    setDeadlineValue(deadline ? deadline.slice(0, 10) : "");
  }, [deadline]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentIndex = PIPELINE.indexOf(status as (typeof PIPELINE)[number]);
  const nextStatus = currentIndex >= 0 && currentIndex < PIPELINE.length - 1 ? PIPELINE[currentIndex + 1] : null;

  const hasEstimate = customerEstimateLow != null && customerEstimateHigh != null && (customerEstimateLow > 0 || customerEstimateHigh > 0);
  const estimateMidpoint = hasEstimate ? Math.round((customerEstimateLow! + customerEstimateHigh!) / 2) : 0;

  function formatTimeAgo(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  }

  function timeToFirstResponse() {
    if (!quotedAt || !createdAt) return "—";
    const created = new Date(createdAt).getTime();
    const quoted = new Date(quotedAt).getTime();
    const hours = Math.round((quoted - created) / (60 * 60 * 1000));
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  }

  const effectiveDeadline = deadlineValue || deadline;
  function deadlineCountdown(): { text: string; urgency: "overdue" | "urgent" | "soon" | "normal" } | null {
    if (!effectiveDeadline) return null;
    const d = new Date(effectiveDeadline + (effectiveDeadline.length === 10 ? "T23:59:59" : ""));
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    const hours = Math.ceil(diff / (60 * 60 * 1000));
    if (days < 0) return { text: `Overdue by ${Math.abs(days)}d`, urgency: "overdue" };
    if (hours <= 24 && days <= 0) return { text: hours <= 0 ? "Overdue" : "Due today", urgency: "urgent" };
    if (days <= 3) return { text: `${days}d left`, urgency: "soon" };
    return { text: `${days}d left`, urgency: "normal" };
  }
  const deadlineStatus = effectiveDeadline ? deadlineCountdown() : null;

  async function handleSaveDeadline() {
    if (!deadlineValue.trim()) return;
    setDeadlineSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: new Date(deadlineValue).toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setMessage({ type: "success", text: "Deadline set." });
    } catch {
      setMessage({ type: "error", text: "Failed to set deadline." });
    } finally {
      setDeadlineSaving(false);
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setStatus(newStatus);
      setMessage({ type: "success", text: "Status updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to update status." });
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign() {
    setAssignSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedStaffId: assignedTo || null }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setMessage({ type: "success", text: "Assignment updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to update assignment." });
    } finally {
      setAssignSaving(false);
    }
  }

  async function handleSendQuote() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "quoted",
          quotedAmount: amount ? parseFloat(amount) : undefined,
          quoteBreakdown: breakdown || undefined,
          quoteValidityDays: validityDays ? parseInt(validityDays, 10) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setStatus("quoted");
      setMessage({ type: "success", text: "Quote sent to customer." });
    } catch {
      setMessage({ type: "error", text: "Failed to send quote." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNote() {
    setNoteSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: internalNote }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setMessage({ type: "success", text: "Note saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save note." });
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-sm">Quick stats</h2>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Time since submitted: {formatTimeAgo(createdAt)}</p>
          <p className="text-muted-foreground">Time to first response: {timeToFirstResponse()}</p>
          <div className="break-words">
            <span className="text-muted-foreground">Deadline: </span>
            {deadlineStatus ? (
              <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {deadlineStatus.urgency === "overdue" && <span className="text-red-600 font-medium">⚠️ Overdue</span>}
                {deadlineStatus.urgency === "urgent" && <span className="text-red-600 font-medium">🔴 Urgent</span>}
                {deadlineStatus.urgency === "soon" && <span className="text-amber-600 font-medium">🟡 Due soon</span>}
                {deadlineStatus.urgency === "normal" && <span className="text-muted-foreground">{deadlineStatus.text}</span>}
                {(deadlineStatus.urgency === "overdue" || deadlineStatus.urgency === "urgent" || deadlineStatus.urgency === "soon") && (
                  <span className="text-muted-foreground">({deadlineStatus.text})</span>
                )}
              </span>
            ) : deadlineHint ? (
              <span className="text-muted-foreground italic break-words">Customer mentioned: &quot;{deadlineHint}&quot;</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="pt-2 border-t border-border">
            <Label className="text-xs text-muted-foreground">Set deadline</Label>
            <div className="flex flex-col gap-2 mt-1 sm:flex-row sm:items-center">
              <Input
                type="date"
                value={deadlineValue}
                onChange={(e) => setDeadlineValue(e.target.value)}
                className="h-8 text-sm w-full sm:w-auto sm:min-w-[140px]"
              />
              <Button size="sm" variant="outline" onClick={handleSaveDeadline} disabled={deadlineSaving || !deadlineValue.trim()} className="shrink-0">
                {deadlineSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status pipeline stepper */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Status pipeline</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile: vertical stepper. Desktop: horizontal */}
          <div className="flex flex-col md:flex-row md:items-center gap-0">
            {PIPELINE.flatMap((s, i) => {
              const isCompleted = currentIndex > i;
              const isCurrent = status === s;
              const stepEl = (
                <div key={s} className="flex flex-1 items-center gap-2 min-w-0 md:flex-col md:gap-0 md:min-w-0">
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? "bg-[#E8440A] border-[#E8440A]"
                        : isCurrent
                          ? "bg-transparent border-[#E8440A] ring-2 ring-[#E8440A]/30"
                          : "bg-muted border-muted-foreground/30"
                    }`}
                  >
                    {isCompleted && <span className="text-[10px] text-white font-bold">✓</span>}
                  </div>
                  <span
                    className={`text-xs font-medium md:mt-1.5 md:text-center leading-tight md:max-w-[4rem] md:text-[11px] ${
                      isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {PIPELINE_LABELS[s] ?? s.replace("_", " ")}
                  </span>
                </div>
              );
              const connectorEl =
                i < PIPELINE.length - 1 ? (
                  <div
                    key={`conn-${s}`}
                    className={`shrink-0 md:flex-1 md:min-w-[6px] md:mx-0.5
                      w-0.5 min-h-[10px] ml-[7px] my-0.5 md:w-auto md:min-h-0 md:h-0.5 md:my-0 md:ml-0 ${
                      isCompleted ? "bg-[#E8440A]" : "bg-muted"
                    }`}
                  />
                ) : null;
              return connectorEl ? [stepEl, connectorEl] : [stepEl];
            })}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {nextStatus && (
              <Button
                size="sm"
                onClick={() => handleUpdateStatus(nextStatus)}
                disabled={saving}
                className="w-full sm:w-auto bg-[#E8440A] hover:bg-[#E8440A]/90"
              >
                → Move to: {PIPELINE_LABELS[nextStatus] ?? nextStatus.replace("_", " ")}
              </Button>
            )}
            {status !== "completed" && status !== "cancelled" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={saving}
                className="text-sm text-red-600 hover:underline text-left"
              >
                ✕ Cancel quote
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign to staff */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Assign to staff</h2>
          <p className="text-xs text-muted-foreground">Assigning sends a notification to that staff member.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Unassigned</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleAssign} disabled={assignSaving}>
            {assignSaving ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Customer's price estimate */}
      <Card className="border-amber-200 bg-[#FFFBEB]">
        <CardHeader>
          <h2 className="font-semibold text-sm">💰 Customer&apos;s price estimate</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {hasEstimate ? (
            <>
              <p className="font-medium text-foreground">
                KES {customerEstimateLow!.toLocaleString()} — KES {customerEstimateHigh!.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-xs">Shown at time of submission</p>
              <p className="text-muted-foreground text-xs">Pre-fill quoted amount with: KES {estimateMidpoint.toLocaleString()}</p>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 bg-white hover:bg-amber-50"
                onClick={() => setAmount(String(estimateMidpoint))}
                disabled={saving}
              >
                Use this amount ↗
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground italic">No estimate generated — customer submitted without pricing</p>
          )}
        </CardContent>
      </Card>

      {/* Send quote to customer */}
      <Card id="send-quote">
        <CardHeader>
          <h2 className="font-semibold">Send quote to customer</h2>
          <p className="text-xs text-muted-foreground">Customer will receive an email with quote details and a link to accept/decline.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Quoted amount (KES)</Label>
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Price breakdown (optional)</Label>
            <Textarea
              className="mt-1 min-h-[80px]"
              value={breakdown}
              onChange={(e) => setBreakdown(e.target.value)}
              placeholder="Itemised breakdown for customer"
            />
          </div>
          <div>
            <Label>Validity period (days)</Label>
            <Input
              type="number"
              min={1}
              className="mt-1 w-24"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              placeholder="7"
            />
            <p className="text-xs text-muted-foreground mt-0.5">e.g. Valid for 7 days</p>
          </div>
          {quotePdfUrl && (
            <p className="text-xs text-muted-foreground">
              <a href={quotePdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Current quote PDF
              </a>
            </p>
          )}
          <p className="text-xs text-muted-foreground">Attach quote PDF via file upload (coming soon).</p>
          <Button onClick={handleSendQuote} disabled={saving} className="bg-[#E8440A] hover:bg-[#E8440A]/90">
            Send quote
          </Button>
        </CardContent>
      </Card>

      {/* Internal note */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Internal note</h2>
          <p className="text-xs text-muted-foreground">Private, staff only. Not visible to customer.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            className="min-h-[100px]"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Private notes (staff only)"
          />
          <Button size="sm" variant="outline" onClick={handleSaveNote} disabled={noteSaving}>
            {noteSaving ? "Saving…" : "Save note"}
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p className={message.type === "success" ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
