import Link from "next/link";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminProductionQueuePage() {
  await requireAdminSection("/admin/production-queue");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Production Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Job scheduling, printer assignment, and status tracking for print jobs.
        </p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Production queue view (print job scheduling and printer status) will be built here.
          </p>
          <Link href="/admin/orders?tab=print-jobs" className="text-primary hover:underline">
            View Print Jobs →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
