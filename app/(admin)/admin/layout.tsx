import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin/admin-nav";
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
      <header className="fixed top-0 left-56 right-0 z-30 h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <span className="text-sm text-muted-foreground">
          {session.user?.name ?? session.user?.email}
        </span>
        <Link href="/" className="text-sm text-primary hover:underline">
          View site
        </Link>
      </header>
      <EditableSectionProvider>
        <main className="pl-56 pt-14 min-h-screen bg-[#F9FAFB]">{children}</main>
      </EditableSectionProvider>
    </div>
  );
}
