import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";

export async function requireAdminSettings() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(role ?? "")) redirect("/login");
  return session;
}

export async function requireSuperAdmin() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") redirect("/admin/dashboard");
  return session;
}
