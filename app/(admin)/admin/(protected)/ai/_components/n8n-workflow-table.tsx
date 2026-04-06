"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Power, ExternalLink } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function N8nWorkflowTable() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await fetch("/api/admin/ai/n8n/workflows");
        if (!res.ok) throw new Error("Failed to fetch workflows");
        const data = await res.json();
        setWorkflows(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center animate-pulse text-muted-foreground">Loading workflows...</div>;
  if (error) return <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">{error}</div>;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 font-semibold text-slate-700">Workflow Name</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Last Updated</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {workflows.map((wf) => (
              <tr key={wf.id} className="hover:bg-muted/50 transition-colors group">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 leading-tight">{wf.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{wf.id}</p>
                </td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
                    wf.active 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${wf.active ? "bg-emerald-500" : "bg-slate-500"}`} />
                    {wf.active ? "Active" : "Inactive"}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(wf.updatedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <a 
                    href={`https://n8n.printhub.africa/workflow/${wf.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                  >
                    Open in n8n
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              </tr>
            ))}
            {workflows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                  No workflows found in n8n.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
