import { requireAdminSection } from "@/lib/admin-route-guard";
import { prisma } from "@/lib/prisma";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { CareersAdminClient } from "./careers-admin-client";

export default async function AdminCareersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; jobId?: string }>;
}) {
  await requireAdminSection("/admin/careers");
  const { tab, jobId } = await searchParams;

  const [listings, applications] = await Promise.all([
    prisma.jobListing.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { applications: true } } },
    }),
    prisma.jobApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        jobListing: { select: { id: true, title: true, department: true, slug: true } },
      },
    }),
  ]);

  const newCount = applications.filter((a) => a.status === "NEW").length;

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumbs items={[{ label: "Careers" }]} />
      <CareersAdminClient
        initialListings={listings}
        initialApplications={applications}
        newApplicationsCount={newCount}
        initialTab={tab === "applications" ? "applications" : "listings"}
        filterJobId={jobId ?? undefined}
      />
    </div>
  );
}
