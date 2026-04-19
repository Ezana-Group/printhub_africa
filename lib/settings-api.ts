import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { revalidatePath } from "next/cache";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export type RoleRequirement = "ADMIN" | "SUPER_ADMIN" | "STAFF";

/**
 * Use in API route handlers. Returns session + user id if authorized, or a NextResponse to return.
 */
export async function requireRole(
  req: Request,
  role: RoleRequirement
): Promise<
  | { session: { user: { id: string; email?: string | null; name?: string | null; role?: string } }; userId: string }
  | NextResponse
> {
  const session = await getServerSession(authOptionsAdmin);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role === "SUPER_ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "ADMIN" && !ADMIN_ROLES.includes(userRole ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "STAFF" && !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(userRole ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session, userId: session.user.id };
}

export function revalidateSitemap(): void {
  revalidatePath("/sitemap.xml");
}
