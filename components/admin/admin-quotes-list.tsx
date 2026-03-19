"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForDisplay } from "@/lib/admin-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { AdminQuotesFilters, type QuoteFiltersState } from "./admin-quotes-filters";
import { MoreHorizontal, Eye, UserPlus, Send, Trash2, Loader2, Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type QuoteRow = {
  id: string;
  quoteNumber: string;
  type: string;
  status: string;
  closedBy?: string | null;
  customerName: string;
  customerEmail: string;
  projectName: string | null;
  deadline: string | null;
  quotedAmount: number | null;
  createdAt: string;
  assignedStaff: { id: string; name: string | null; email: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  large_format: "Large Format",
  three_d_print: "3D Print",
  design_and_print: "I Have an Idea",
};

// AUDIT FIX: brand orange #E8440A — no blue; use orange for primary types/statuses
const TYPE_BADGE_CLASS: Record<string, string> = {
  large_format: "bg-orange-100 text-orange-800 border-0",
  three_d_print: "bg-purple-100 text-purple-800 border-0",
  design_and_print: "bg-green-100 text-green-800 border-0",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  new: "bg-red-100 text-red-800 border-0",
  reviewing: "bg-amber-100 text-amber-800 border-0",
  quoted: "bg-orange-100 text-orange-800 border-0",
  accepted: "bg-green-100 text-green-800 border-0",
  in_production: "bg-orange-100 text-orange-800 border-0",
  completed: "bg-emerald-700 text-white border-0",
  cancelled: "bg-slate-100 text-slate-600 border-0",
  rejected: "bg-slate-100 text-slate-600 border-0",
};

function buildQuery(f: QuoteFiltersState) {
  const params = new URLSearchParams();
  if (f.search.trim()) params.set("search", f.search.trim());
  if (f.type) params.set("type", f.type);
  if (f.status) params.set("status", f.status);
  if (f.assignedTo) params.set("assignedTo", f.assignedTo);
  if (f.dateFrom) params.set("dateFrom", f.dateFrom);
  if (f.dateTo) params.set("dateTo", f.dateTo);
  params.set("limit", "100");
  return params.toString();
}

export function AdminQuotesList({
  initialQuotes,
  staffList,
}: {
  initialQuotes: QuoteRow[];
  staffList: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>(initialQuotes);
  const [filters, setFilters] = useState<QuoteFiltersState>({
    search: "",
    type: "",
    status: "",
    assignedTo: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignQuoteId, setAssignQuoteId] = useState<string | null>(null);
  const [statusQuoteId, setStatusQuoteId] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const q = buildQuery(filters);
      const res = await fetch(`/api/quotes${q ? `?${q}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setQuotes(data.quotes ?? []);
    } catch {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleExportCsv = useCallback(() => {
    const headers = ["Quote #", "Type", "Customer", "Email", "Submitted", "Deadline", "Budget/Est.", "Status", "Assigned To"];
    const rows = quotes.map((q) => [
      q.quoteNumber,
      TYPE_LABELS[q.type] ?? q.type,
      q.customerName,
      q.customerEmail,
      q.createdAt,
      q.deadline ?? "",
      q.quotedAmount != null ? String(q.quotedAmount) : "",
      q.status.replace("_", " "),
      q.assignedStaff?.name ?? q.assignedStaff?.email ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [quotes]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        setDeleteId(null);
      }
    } catch {
      // ignore
    }
  };

  const handleAssign = async (quoteId: string, staffId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedStaffId: staffId || null }),
      });
      if (res.ok) {
        setAssignQuoteId(null);
        fetchQuotes();
      }
    } catch {
      // ignore
    }
  };

  const handleStatusChange = async (quoteId: string, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setStatusQuoteId(null);
        fetchQuotes();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <AdminQuotesFilters
        filters={filters}
        onFiltersChange={setFilters}
        staffList={staffList}
        onExportCsv={handleExportCsv}
        exportDisabled={quotes.length === 0}
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Quote #</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Submitted</th>
                  <th className="text-left p-4 font-medium">Deadline</th>
                  <th className="text-left p-4 font-medium">Budget/Est.</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Assigned To</th>
                  <th className="text-left p-4 font-medium w-[60px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("[data-no-row-click]")) return;
                        router.push(`/admin/quotes/${q.id}`);
                      }}
                    >
                      <td className="p-4 font-medium">{q.quoteNumber}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className={TYPE_BADGE_CLASS[q.type] ?? "text-xs"}>
                          {TYPE_LABELS[q.type] ?? q.type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{q.customerName}</span>
                        <br />
                        <span className="text-muted-foreground text-xs">{q.customerEmail}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDateForDisplay(q.createdAt)}</td>
                      <td className="p-4 text-muted-foreground">{q.deadline ? formatDateForDisplay(q.deadline) : "—"}</td>
                      <td className="p-4">
                        {q.quotedAmount != null ? `KES ${q.quotedAmount.toLocaleString()}` : "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_BADGE_CLASS[q.status] ?? "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {q.status.replace("_", " ")}
                          </span>
                          {q.closedBy === "CUSTOMER" && (
                            <span title="Closed by customer — read only">
                              <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{q.assignedStaff?.name ?? q.assignedStaff?.email ?? "—"}</td>
                      <td className="p-4" data-no-row-click>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/quotes/${q.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View / Open quote
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAssignQuoteId(q.id); }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign to staff
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setStatusQuoteId(q.id); }}>
                              <Send className="mr-2 h-4 w-4" />
                              Change status
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/quotes/${q.id}#send-quote`}>
                                <Send className="mr-2 h-4 w-4" />
                                Send quote to customer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => { e.preventDefault(); setDeleteId(q.id); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && quotes.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No quotes found</p>
          )}
        </CardContent>
      </Card>

      {/* Assign modal */}
      {assignQuoteId && (
        <AlertDialog open={!!assignQuoteId} onOpenChange={() => setAssignQuoteId(null)}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Assign to staff</AlertDialogTitle>
              <AlertDialogDescription>Select a staff member to assign this quote to.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Select
                placeholder="Choose staff…"
                options={[
                  { value: "", label: "Unassigned" },
                  ...staffList.map((s) => ({ value: s.id, label: s.name || s.email })),
                ]}
                value={quotes.find((q) => q.id === assignQuoteId)?.assignedStaff?.id ?? ""}
                onChange={(e) => handleAssign(assignQuoteId, e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Status change modal */}
      {statusQuoteId && (
        <AlertDialog open={!!statusQuoteId} onOpenChange={() => setStatusQuoteId(null)}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Change status</AlertDialogTitle>
              <AlertDialogDescription>Select the new status for this quote.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-wrap gap-2 py-2">
              {(["new", "reviewing", "quoted", "accepted", "in_production", "completed", "cancelled"] as const).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(statusQuoteId, s)}
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this quote. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
