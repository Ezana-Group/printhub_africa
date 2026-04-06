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
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [execRes, wfRes] = await Promise.all([
          fetch("/api/admin/ai/n8n/executions?limit=50"),
          fetch("/api/admin/ai/n8n/workflows")
        ]);

        if (!execRes.ok || !wfRes.ok) throw new Error("Failed to fetch n8n data");

        const execData = await execRes.json();
        const wfData = await wfRes.json();

        setExecutions(execData.data || []);
        setWorkflows(wfData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getWorkflowName = (id: string) => {
    const wf = workflows.find(w => w.id === id);
    return wf ? wf.name : "System Task";
  };

  if (loading) return (
    <div className="h-60 flex flex-col items-center justify-center animate-pulse text-muted-foreground gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
      <span className="text-sm font-medium">Syncing execution history...</span>
    </div>
  );

  if (error) return <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">{error}</div>;

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest leading-none">Live Execution Feed</h3>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium uppercase">Syncing every 30s</p>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {executions.map((exe) => (
          <div key={exe.id} className="group">
            <div 
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${exe.status === 'error' ? 'bg-red-50/30' : ''}`}
              onClick={() => setExpandedId(expandedId === exe.id ? null : exe.id)}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={exe.status} />
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {getWorkflowName(exe.workflowId)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 font-mono">ID: #{exe.id}</p>
                    <span className="text-[10px] text-slate-300">•</span>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {new Date(exe.startedAt).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                  exe.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  exe.status === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {exe.status}
                </div>
                {expandedId === exe.id ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
              </div>
            </div>
            {expandedId === exe.id && (
              <div className="px-4 py-4 bg-slate-50/50 border-t border-slate-100 text-xs space-y-4 animate-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Time Logs</p>
                    <p className="text-slate-600 font-medium">Start: {new Date(exe.startedAt).toLocaleString("en-GB")}</p>
                    <p className="text-slate-600 font-medium">
                      End: {exe.stoppedAt ? new Date(exe.stoppedAt).toLocaleString("en-GB") : "In Progress"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Performance</p>
                    <p className="text-slate-600 font-medium">
                      Duration: {exe.stoppedAt ? `${Math.round((new Date(exe.stoppedAt).getTime() - new Date(exe.startedAt).getTime()) / 1000)}s` : "Pending"}
                    </p>
                    <p className="text-slate-600 font-medium truncate">Master ID: {exe.workflowId}</p>
                  </div>
                </div>
                
                {exe.status === 'error' && exe.error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                       <AlertCircle className="h-3.5 w-3.5" />
                       Failure Trace
                    </div>
                    <p className="font-mono text-[11px] leading-relaxed break-words">{exe.error.message}</p>
                    {exe.error.description && <p className="text-[11px] opacity-80">{exe.error.description}</p>}
                  </div>
                )}
                
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <a 
                    href={`https://n8n.printhub.africa/workflow/${exe.workflowId}/executions/${exe.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-primary hover:bg-slate-50 transition-all font-bold uppercase text-[10px] shadow-sm"
                  >
                    Deep Audit in n8n
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
        {executions.length === 0 && (
          <div className="py-20 text-center space-y-3">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6 text-slate-300" />
             </div>
             <p className="text-slate-500 font-medium italic">No execution signals found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Execution["status"] }) {
  switch (status) {
    case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "error": return <XCircle className="h-4 w-4 text-red-500" />;
    case "running": return <Clock className="h-4 w-4 text-amber-500 animate-spin" />;
    default: return <AlertCircle className="h-4 w-4 text-slate-400" />;
  }
}
