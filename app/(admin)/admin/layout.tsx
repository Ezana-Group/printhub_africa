import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  const permissions = (session.user as { permissions?: string[] }).permissions;
  if (!role || !ADMIN_ROLES.includes(role)) redirect("/login");

  const newQuotesCount = await prisma.quote.count({ where: { status: "new" } }).catch(() => 0);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-card">
        <Link href="/admin/dashboard" className="shrink-0 p-4 font-display font-bold text-primary">
          PrintHub Admin
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminNav role={role} permissions={permissions} newQuotesCount={newQuotesCount} />
        </div>
      </aside>
      <AdminHeaderClient
        userName={session.user?.name ?? undefined}
        userEmail={session.user?.email ?? undefined}
      />
      <EditableSectionProvider>
        <main className="fixed left-56 top-14 right-0 bottom-0 overflow-y-auto overflow-x-hidden bg-[#F9FAFB]">
          {children}
        </main>
      </EditableSectionProvider>
    </div>
  );
}
