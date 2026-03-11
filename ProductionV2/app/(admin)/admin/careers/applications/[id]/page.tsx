import { requireAdminSection } from "@/lib/admin-route-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { ApplicationDetailClient } from "./application-detail-client";

export default async function AdminCareersApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/careers");
  const { id } = await params;
  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: { jobListing: true },
  });
  if (!application) notFound();

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Careers", href: "/admin/careers" },
          { label: "Applications", href: "/admin/careers?tab=applications" },
          { label: `${application.firstName} ${application.lastName}` },
        ]}
      />
      <div className="flex items-center justify-between">
        <Link
          href="/admin/careers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Applications
        </Link>
        <a
          href={`/api/admin/careers/applications/${application.id}/cv`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Download CV
        </a>
      </div>
      <ApplicationDetailClient application={application} />
    </div>
  );
}
