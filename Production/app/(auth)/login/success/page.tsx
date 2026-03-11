import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export const dynamic = "force-dynamic";

export default async function LoginSuccessPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role;
  const isAdmin = role && ADMIN_ROLES.includes(role);
  redirect(isAdmin ? "/admin/dashboard" : "/");
}
