import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MyAccountForm } from "@/components/admin/settings/my-account-form";

export default async function AdminMyAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true },
  });
  const twoFaEnabled = !!user?.totpSecret;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Account</h1>
      <MyAccountForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        twoFaEnabled={twoFaEnabled}
      />
    </div>
  );
}
