import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessRoute } from "@/lib/admin-permissions";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/**
 * Use at the top of an admin page (e.g. finance, orders). If the current user
 * cannot access this section, redirects to /admin/access-denied.
 * Call this in server components only.
 */
export async function requireAdminSection(sectionPath: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  const permissions = (session.user as { permissions?: string[] }).permissions;
  if (!role || !ADMIN_ROLES.includes(role)) redirect("/login");
  if (!canAccessRoute(sectionPath, role, permissions ?? [])) {
    redirect("/admin/access-denied");
  }
}
