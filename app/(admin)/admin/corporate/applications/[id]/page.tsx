import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { CorporateApplicationDetailClient } from "./corporate-application-detail-client";

export default async function AdminCorporateApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/corporate");
  const { id } = await params;

  const application = await prisma.corporateApplication.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
    },
  });

  if (!application) notFound();

  return (
    <div className="p-6 space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Corporate", href: "/admin/corporate" },
          { label: "Applications", href: "/admin/corporate/applications" },
          { label: application.companyName },
        ]}
      />
      <div className="flex items-center justify-between">
        <Link
          href="/admin/corporate/applications"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to applications
        </Link>
      </div>
      <CorporateApplicationDetailClient application={application} />
    </div>
  );
}
