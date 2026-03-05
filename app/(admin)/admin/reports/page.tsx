import { Card, CardContent } from "@/components/ui/card";
import { LFProfitabilityCard } from "@/components/admin/lf-profitability-card";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminReportsPage() {
  await requireAdminSection("/admin/reports");
  return (
    <div className="p-6 space-y-6">
      <h1 className="font-display text-2xl font-bold">Reports</h1>
      <LFProfitabilityCard />
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Sales, product performance, and VAT reports coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
