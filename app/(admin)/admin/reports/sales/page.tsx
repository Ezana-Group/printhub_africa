export const dynamic = 'force-dynamic'
import { requireAdminSection } from "@/lib/admin-route-guard";
import SalesReportsClient from "./sales-reports-client";

export default async function AdminReportsSalesPage() {
  await requireAdminSection("/admin/reports");
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">Sales Reports</h1>
        <p className="text-muted-foreground">Monitor your revenue, orders, and financial health.</p>
      </div>

      <SalesReportsClient />
    </div>
  );
}
