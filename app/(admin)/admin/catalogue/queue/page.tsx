export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRoute } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { CatalogueStatus } from "@prisma/client";
import Link from "next/link";
import { AdminCatalogueQueueClient } from "./admin-catalogue-queue-client";

export default async function AdminCatalogueQueuePage() {
  try {

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!canAccessRoute("/admin/catalogue/queue", role, permissions)) {
    redirect("/admin/access-denied");
  }

  const items = await prisma.catalogueItem.findMany({
    where: { status: CatalogueStatus.PENDING_REVIEW },
    orderBy: { updatedAt: "asc" },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      availableMaterials: true,
      category: { select: { name: true, slug: true } },
    },
  });

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Approval Queue</h1>
          <p className="text-slate-600 mt-0.5">Review and approve catalogue items</p>
        </div>
        {items.length > 0 && (
          <span className="bg-amber-100 text-amber-700 text-sm font-medium px-3 py-1 rounded-full">
            {items.length} awaiting review
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <p className="text-slate-500 font-medium">No items awaiting review</p>
          <p className="text-sm text-slate-400 mt-1">
            Items appear here when you click &quot;Submit for review&quot; on a DRAFT item
          </p>
          <Link
            href="/admin/catalogue"
            className="mt-4 inline-block text-sm text-[#FF4D00] hover:underline"
          >
            ← Back to catalogue
          </Link>
        </div>
      ) : (
        <AdminCatalogueQueueClient
          className="mt-0"
          initialItems={JSON.parse(
            JSON.stringify(items, (_, v) => (typeof v === "bigint" ? Number(v) : v))
          )}
        />
      )}
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
