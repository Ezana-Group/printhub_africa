import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { getSettingsNavForRole } from "@/lib/settings-nav-config";
import { SettingsNav } from "@/components/admin/settings-nav";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSection("/admin/settings");
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "STAFF";
  const navItems = getSettingsNavForRole(role);

  return (
    <div className="flex min-h-full">
      <SettingsNav items={navItems} />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
