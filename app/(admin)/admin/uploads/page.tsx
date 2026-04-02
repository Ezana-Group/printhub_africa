export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { canAccessRoute } from "@/lib/admin-permissions";
import { AdminUploadsClient } from "./admin-uploads-client";
import { prisma } from "@/lib/prisma";

export default async function AdminUploadsPage() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role ?? "";
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  if (!canAccessRoute("/admin/uploads", role, permissions)) {
    redirect("/admin/access-denied");
  }

  const [uploads, counts] = await Promise.all([
    prisma.uploadedFile.findMany({
      where: { uploadContext: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true } },
        quote: { select: { id: true, quoteNumber: true } },
      },
    }),
    prisma.uploadedFile.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    counts.map((c) => [c.status, c._count.id])
  );

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      <h1 className="font-display text-2xl font-bold text-slate-900">Uploads</h1>
      <p className="text-slate-600 mt-0.5">
        Customer and staff file uploads · review and download
      </p>
      <AdminUploadsClient
        initialUploads={uploads}
        statusCounts={statusCounts}
      />
    </div>
  );
}
