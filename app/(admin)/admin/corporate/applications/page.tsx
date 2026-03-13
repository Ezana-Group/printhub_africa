import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { CorporateApplicationsList } from "./corporate-applications-list";

export default async function AdminCorporateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminSection("/admin/corporate");
  const { status: statusFilter } = await searchParams;

  const applications = await prisma.corporateApplication.findMany({
    where:
      statusFilter === "PENDING" || statusFilter === "APPROVED" || statusFilter === "REJECTED"
        ? { status: statusFilter }
        : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      applicant: { select: { name: true, email: true } },
    },
  });

  const [counts, totalCount] = await Promise.all([
    prisma.corporateApplication.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.corporateApplication.count(),
  ]);
  const countByStatus: Record<string, number> = { "": totalCount };
  counts.forEach((c) => {
    countByStatus[c.status] = c._count.id;
  });

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Corporate", href: "/admin/corporate" },
          { label: "Applications" },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Corporate applications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and approve or reject corporate account applications.
          </p>
        </div>
      </div>
      <CorporateApplicationsList
        applications={applications}
        countByStatus={countByStatus}
        currentStatusFilter={statusFilter}
      />
    </div>
  );
}
