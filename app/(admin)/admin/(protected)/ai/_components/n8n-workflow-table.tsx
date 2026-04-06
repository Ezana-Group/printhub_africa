"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Power, ExternalLink, Shield, Package, ShoppingCart, MessageSquare, BarChart3, Megaphone, Bell } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "all", label: "All Workflows", icon: null },
  { id: "security", label: "Security", icon: Shield, keywords: ["auth", "security", "login", "travel", "impossible"] },
  { id: "catalog", label: "Catalog", icon: Package, keywords: ["catalog", "inventory", "stock", "price", "3d", "print"] },
  { id: "sales", label: "Sales", icon: ShoppingCart, keywords: ["commerce", "sales", "order", "abandoned", "checkout", "quote"] },
  { id: "support", label: "Support", icon: MessageSquare, keywords: ["support", "ticket", "response", "claude", "sentiment"] },
  { id: "reports", label: "Reports", icon: BarChart3, keywords: ["report", "analytics", "cron", "weekly", "daily", "maps"] },
  { id: "marketing", label: "Marketing", icon: Megaphone, keywords: ["marketing", "content", "ad", "social", "post", "broadcast"] },
  { id: "notifications", label: "Notifications", icon: Bell, keywords: ["notify", "notification", "alert", "whatsapp", "sms", "email"] },
];

export function N8nWorkflowTable() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

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

  const classifyWorkflow = (wf: Workflow) => {
    const name = wf.name.toLowerCase();
    for (const cat of CATEGORIES) {
      if (cat.id === "all") continue;
      if (cat.keywords?.some(k => name.includes(k))) return cat.id;
    }
    return "other";
  };

  const filteredWorkflows = workflows.filter(wf => {
    if (activeTab === "all") return true;
    return classifyWorkflow(wf) === activeTab;
  });

  if (loading) return <div className="h-40 flex items-center justify-center animate-pulse text-muted-foreground">Loading blueprints...</div>;
  if (error) return <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">{error}</div>;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1 border border-slate-200 w-full justify-start overflow-x-auto h-auto flex-wrap sm:flex-nowrap">
          {CATEGORIES.map(cat => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="text-[10px] sm:text-xs font-bold uppercase tracking-tight data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 py-1.5"
            >
              <div className="flex items-center gap-1.5">
                {cat.icon && <cat.icon className="h-3 w-3" />}
                {cat.label}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="rounded-xl border bg-card overflow-hidden mt-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 font-semibold text-slate-700">Workflow Blueprint</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Last Synced</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkflows.map((wf) => (
                  <tr key={wf.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <p className="font-bold text-slate-900 leading-tight flex items-center gap-2">
                           {wf.name}
                           <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono font-normal">{wf.id}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">Source: {classifyWorkflow(wf)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                        wf.active 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-slate-500/10 text-slate-600 border-slate-500/10"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${wf.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {wf.active ? "Live" : "Standby"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium text-xs">
                      {new Date(wf.updatedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a 
                        href={`https://n8n.printhub.africa/workflow/${wf.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-bold uppercase"
                      >
                        Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
                {filteredWorkflows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-slate-100">
                          <Package className="h-6 w-6 text-slate-400" />
                        </div>
                        No blueprints found for this category.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
