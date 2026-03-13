import Link from "next/link";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { ProductionKanbanClient } from "./production-kanban-client";

export default async function AdminProductionQueuePage() {
  await requireAdminSection("/admin/production-queue");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Production Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Move jobs through stages: Queued → In Progress → Printing → Quality Check → Done.
          </p>
        </div>
        <Link href="/admin/orders?tab=print-jobs" className="text-sm text-primary hover:underline">
          View Print Jobs →
        </Link>
      </div>
      <ProductionKanbanClient />
    </div>
  );
}
