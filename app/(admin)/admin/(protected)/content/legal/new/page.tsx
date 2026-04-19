export const dynamic = 'force-dynamic'
import { requireAdminSettings } from "@/lib/auth-guard";
import Link from "next/link";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AddLegalPageForm } from "./AddLegalPageForm";

export default async function AdminContentLegalNewPage() {
  await requireAdminSettings();

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Content", href: "/admin/content/legal" },
          { label: "Legal Pages", href: "/admin/content/legal" },
          { label: "Add legal page" },
        ]}
      />
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Add legal page</h1>
        <p className="text-slate-600 text-sm mt-1">
          Create a new legal page. It will be draft (unpublished) until you save & publish from the editor.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <AddLegalPageForm />
      </div>
      <Link
        href="/admin/content/legal"
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Back to Legal Pages
      </Link>
    </div>
  );
}
