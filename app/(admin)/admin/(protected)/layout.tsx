import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminHeaderClient } from "@/components/admin/admin-header-client";
import { EditableSectionProvider } from "@/components/admin/editable-section-context";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) {
    redirect("/login");
  }
  
  const user = session.user as any;
  if (!user.role || !ADMIN_ROLES.includes(user.role)) {
    redirect("/login");
  }

  const role = user.role;
  const permissions = user.permissions;

  const newQuotesCount = await prisma.quote.count({ where: { status: "new" } }).catch(() => 0);
  
  const [pendingCatalogue, pendingMockups, pendingVideos, pendingBroadcasts] = await Promise.all([
    prisma.catalogueItem.count({ where: { status: "PENDING_REVIEW" } }).catch(() => 0),
    prisma.productMockup.count({ where: { status: "PENDING_REVIEW" } }).catch(() => 0),
    prisma.productVideo.count({ where: { status: "PENDING_REVIEW" } }).catch(() => 0),
    prisma.marketingBroadcast.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  const pendingApprovalCount = pendingCatalogue + pendingMockups + pendingVideos + pendingBroadcasts;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-card">
        <Link href="/admin/dashboard" className="shrink-0 p-4 font-display font-bold text-primary">
          PrintHub Admin
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav 
            role={role} 
            permissions={permissions} 
            newQuotesCount={newQuotesCount} 
            pendingApprovalCount={pendingApprovalCount}
          />
        </div>
      </aside>
      <AdminHeaderClient
        userName={session.user?.name ?? undefined}
        userEmail={session.user?.email ?? undefined}
        role={role}
      />
      <EditableSectionProvider>
        <main className="fixed left-56 top-14 right-0 bottom-0 overflow-y-auto overflow-x-hidden bg-[#F9FAFB]">
          {children}
        </main>
      </EditableSectionProvider>
    </div>
  );
}
