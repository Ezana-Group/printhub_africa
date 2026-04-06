import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/admin-permissions";
import { N8nWorkflowTable } from "../_components/n8n-workflow-table";
import { N8nExecutionLog } from "../_components/n8n-execution-log";
import Link from "next/link";
import { ChevronLeft, LayoutGrid, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Workflow Monitor | PrintHub Admin",
  description: "Monitor and manage n8n automations for PrintHub Africa.",
};

export default async function N8nWorkflowMonitorPage() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role ?? "";
  const permissions = (session.user as any).permissions ?? [];

  if (!canAccessRoute("/admin/ai", role, permissions)) {
    redirect("/admin/access-denied");
  }

  return (
    <div className="p-6 space-y-10 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link 
            href="/admin/ai" 
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to AI Control Centre
          </Link>
          <h1 className="font-display text-2xl font-bold italic text-slate-800">
            N8N Automation Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-tight font-semibold">
            Real-time infrastructure visibility for Printhub V3.1
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workflows */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 leading-tight">Workflows & Logic</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Blueprint Management</p>
              </div>
            </div>
            <N8nWorkflowTable />
          </section>
        </div>

        {/* Right Column: Execution Log */}
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 leading-tight">Live Activity</h2>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Operations Stream</p>
              </div>
            </div>
            <N8nExecutionLog />
          </section>
        </div>
      </div>
    </div>
  );
}
