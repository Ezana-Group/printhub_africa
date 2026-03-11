import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { FaqManagerClient } from "./faq-manager-client";

export default async function AdminContentFaqPage() {
  await requireAdminSettings();
  const categories = await prisma.faqCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      faqs: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "FAQ Manager" },
        ]}
      />
      <h1 className="font-display text-2xl font-bold">FAQ Manager</h1>
      <FaqManagerClient initialCategories={categories} />
    </div>
  );
}
