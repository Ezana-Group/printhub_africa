import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRoute } from "@/lib/admin-permissions";
import Link from "next/link";
import { AdminCatalogueClient } from "./admin-catalogue-client";

export default async function AdminCataloguePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!canAccessRoute("/admin/catalogue", role, permissions)) {
    redirect("/admin/access-denied");
  }
  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Catalogue</h1>
          <p className="text-slate-600 mt-0.5">Print-on-Demand catalogue items</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/catalogue/new"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Add item
          </Link>
          <Link
            href="/admin/catalogue/import"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Import from Printables
          </Link>
          <Link
            href="/admin/catalogue/queue"
            className="text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            Approval queue →
          </Link>
        </div>
      </div>
      <AdminCatalogueClient />
    </div>
  );
}
