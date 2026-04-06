"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "error" | "waiting" | "running";
  startedAt: string;
  stoppedAt: string | null;
  error?: {
    message: string;
    description?: string;
  };
}

export function N8nExecutionLog() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const res = await fetch("/api/admin/ai/n8n/executions?limit=50");
        if (!res.ok) throw new Error("Failed to fetch executions");
        const data = await res.json();
        setExecutions(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-60 flex items-center justify-center animate-pulse text-muted-foreground">Loading execution log...</div>;
  if (error) return <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">{error}</div>;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Live Execution Feed</h3>
        <p className="text-[10px] text-muted-foreground">Updating every 30s</p>
      </div>
      <div className="divide-y max-h-[600px] overflow-y-auto">
        {executions.map((exe) => (
          <div key={exe.id} className="group">
            <div 
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${exe.status === 'error' ? 'bg-destructive/5' : ''}`}
              onClick={() => setExpandedId(expandedId === exe.id ? null : exe.id)}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={exe.status} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{exe.workflowName || "Unknown Workflow"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground font-mono">#{exe.id}</p>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(exe.startedAt).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`text-[11px] font-bold uppercase ${
                  exe.status === 'success' ? 'text-emerald-600' : 
                  exe.status === 'error' ? 'text-destructive' : 
                  'text-amber-500'
                }`}>
                  {exe.status}
                </p>
                {expandedId === exe.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>
            {expandedId === exe.id && (
              <div className="px-4 py-3 bg-slate-50 border-t text-xs space-y-2">
                <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                  <p>Started: {new Date(exe.startedAt).toLocaleString("en-GB")}</p>
                  <p>Duration: {exe.stoppedAt ? `${Math.round((new Date(exe.stoppedAt).getTime() - new Date(exe.startedAt).getTime()) / 1000)}s` : "Running..."}</p>
                  <p>Workflow: {exe.workflowId}</p>
                </div>
                {exe.status === 'error' && exe.error && (
                  <div className="p-2 bg-destructive/10 text-destructive rounded border border-destructive/20 mt-2">
                    <p className="font-bold">Error Breakdown:</p>
                    <p className="mt-1 font-mono">{exe.error.message}</p>
                    {exe.error.description && <p className="mt-1">{exe.error.description}</p>}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <a 
                    href={`https://n8n.printhub.africa/workflow/${exe.workflowId}/executions/${exe.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    View in n8n UI
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
        {executions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground italic">
            No executions recorded in n8n.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Execution["status"] }) {
  switch (status) {
    case "success": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "error": return <XCircle className="h-5 w-5 text-destructive" />;
    case "running": return <Clock className="h-5 w-5 text-amber-500 animate-spin" />;
    default: return <AlertCircle className="h-5 w-5 text-slate-400" />;
  }
}
