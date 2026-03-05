import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyAccountForm } from "@/components/admin/settings/my-account-form";

export default async function AdminMyAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Account</h1>
      <MyAccountForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
    </div>
  );
}
