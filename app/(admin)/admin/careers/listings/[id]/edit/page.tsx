import { requireAdminSection } from "@/lib/admin-route-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { JobListingEditForm } from "../../job-listing-edit-form";

export default async function AdminCareersListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/careers");
  const { id } = await params;
  const listing = await prisma.jobListing.findUnique({ where: { id } });
  if (!listing) notFound();

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Careers", href: "/admin/careers" },
          { label: "Job Listings", href: "/admin/careers" },
          { label: listing.title },
        ]}
      />
      <h1 className="font-display text-2xl font-bold">Edit: {listing.title}</h1>
      <JobListingEditForm listing={listing} />
    </div>
  );
}
