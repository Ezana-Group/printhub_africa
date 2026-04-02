"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuditLogEntry = {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  user: { name: string | null; role: string; email: string | null } | null;
  ipAddress: string | null;
  before: unknown;
  after: unknown;
};

type AuditLogResponse = {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function AuditLogClient() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", "50");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/admin/settings/audit-log?${params}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.logs) setData(body);
        else setData({ logs: [], total: 0, page: 1, perPage: 50, totalPages: 0 });
      })
      .catch(() => setData({ logs: [], total: 0, page: 1, perPage: 50, totalPages: 0 }))
      .finally(() => setLoading(false));
  }, [page, from, to, q]);

  const applyFilters = () => {
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q.trim()) params.set("q", q.trim());
      
      const res = await fetch(`/api/admin/settings/audit-log/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export audit log.");
    } finally {
      setExporting(false);
    }
  };

  const formatTs = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return ts;
    }
  };

  return (
    <SectionCard title="Log entries" description="Timestamp, user, role, action, target, and details.">
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <Input
          type="date"
          className="h-10 w-[140px]"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          type="date"
          className="h-10 w-[140px]"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Input
          type="search"
          placeholder="Search action, entity..."
          className="h-10 w-48"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="button" variant="outline" size="sm" onClick={applyFilters}>
          Apply
        </Button>
        <div className="flex-1" />
        <Button 
          type="button" 
          variant="default" 
          size="sm" 
          onClick={handleExport}
          disabled={exporting}
          className="bg-primary hover:bg-primary/90"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>
      <div className="mb-4 text-xs text-muted-foreground italic">
        Showing {data?.logs?.length || 0} of {data?.total || 0} total entries
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground py-8">Loading...</p>
      ) : !data?.logs?.length ? (
        <p className="text-sm text-muted-foreground py-8">No log entries found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-2 font-medium text-muted-foreground">Timestamp</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Action</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Target</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((row) => (
                  <tr key={row.id} className="border-b border-[#E5E7EB]">
                    <td className="py-3">{formatTs(row.timestamp)}</td>
                    <td className="py-3">{row.user?.name ?? row.user?.email ?? "—"}</td>
                    <td className="py-3">{row.user?.role ?? "—"}</td>
                    <td className="py-3">{row.action}</td>
                    <td className="py-3">{row.entity}{row.entityId ? ` · ${row.entityId}` : ""}</td>
                    <td className="py-3 text-muted-foreground">{row.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} total)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
