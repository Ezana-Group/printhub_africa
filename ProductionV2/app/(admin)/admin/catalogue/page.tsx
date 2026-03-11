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
        <Link
          href="/admin/catalogue/queue"
          className="text-sm font-medium text-amber-600 hover:text-amber-700"
        >
          Approval queue →
        </Link>
      </div>
      <AdminCatalogueClient />
    </div>
  );
}
