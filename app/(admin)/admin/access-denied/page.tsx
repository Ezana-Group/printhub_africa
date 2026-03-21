export const dynamic = 'force-dynamic'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

export default function AdminAccessDeniedPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <AdminBreadcrumbs items={[{ label: "Access denied" }]} />
      <div className="mt-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-amber-900">Access denied</h1>
        <p className="mt-2 text-sm text-amber-800">
          You don&apos;t have permission to view this section. Contact your administrator if you
          believe this is an error.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
