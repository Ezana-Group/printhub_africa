import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { redirect } from "next/navigation";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export const dynamic = "force-dynamic";

export default async function LoginSuccessPage() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role;
  const isAdmin = role && ADMIN_ROLES.includes(role);
  redirect(isAdmin ? "/admin/dashboard" : "/");
}
