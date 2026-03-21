export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFirstSettingsHref } from "@/lib/settings-nav-config";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "STAFF";
  redirect(getFirstSettingsHref(role));
}
