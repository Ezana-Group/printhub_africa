export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { canAccessRoute } from "@/lib/admin-permissions";
import { redirect } from "next/navigation";
import { AdminCatalogueApprovalQueueClient } from "./admin-catalogue-approval-queue-client";

export default async function AdminCatalogueApprovalQueuePage() {
  try {
    const session = await getServerSession(authOptionsAdmin);
    const role = (session?.user as { role?: string })?.role ?? "";
    const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];

    if (!canAccessRoute("/admin/catalogue/approval-queue", role, permissions)) {
      redirect("/admin/access-denied");
    }

    return (
      <div className="container mx-auto py-8 px-4 h-full">
        <div className="flex flex-col gap-6 h-full">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Approval Queue</h1>
            <p className="text-slate-500 mt-1">
              Review, approve, and manage imported 3D models for the catalogue.
            </p>
          </div>

          <AdminCatalogueApprovalQueueClient />
        </div>
      </div>
    );
  } catch (e) {
    console.error('[ApprovalQueue] Server render error:', e);
    throw e;
  }
}
