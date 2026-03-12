import { requireSuperAdmin } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { AuditLogClient } from "@/components/admin/audit-log-client";

export default async function AdminSettingsAuditLogPage() {
  await requireSuperAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Audit Log</h1>
      <p className="text-sm text-muted-foreground">
        Complete record of significant actions in the admin panel. Filter by date range and search.
      </p>
      <SectionCard
        title="Filters & Export"
        description="Filter by date range. Search by action, entity, or reference."
      >
        <p className="text-xs text-muted-foreground">Use the filters in the log table below. Export via API when needed.</p>
      </SectionCard>
      <AuditLogClient />
    </div>
  );
}
