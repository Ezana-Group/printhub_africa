import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission, hasFinanceAccess } from "@/lib/admin-permissions";
import type { PermissionKey } from "@/lib/admin-permissions";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export type AdminApiContext =
  | { permission: PermissionKey; needEdit?: boolean }
  | { finance: true; needEdit?: boolean };

export type AdminApiAuth = { session: Session; role: string; permissions: string[] };

/**
 * Use at the start of an admin API route. Returns session + role + permissions if allowed, or a 401/403 NextResponse to return.
 */
export async function requireAdminApi(context: AdminApiContext): Promise<AdminApiAuth | NextResponse> {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];

  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authSession = session as Session;
  if (ADMIN_ROLES.includes(role)) {
    return { session: authSession, role, permissions };
  }

  if ("finance" in context) {
    if (!hasFinanceAccess(role, permissions, context.needEdit ?? false)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return { session: authSession, role, permissions };
  }

  const required = context.permission;
  if (!hasPermission(role, permissions, required)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { session: authSession, role, permissions };
}
