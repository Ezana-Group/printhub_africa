import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRoute } from "@/lib/admin-permissions";
import { AdminCatalogueQueueClient } from "./admin-catalogue-queue-client";

export default async function AdminCatalogueQueuePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!canAccessRoute("/admin/catalogue/queue", role, permissions)) {
    redirect("/admin/access-denied");
  }
  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <h1 className="font-display text-2xl font-bold text-slate-900">Approval Queue</h1>
      <p className="text-slate-600 mt-0.5">Review and approve catalogue items</p>
      <AdminCatalogueQueueClient className="mt-6" />
    </div>
  );
}
