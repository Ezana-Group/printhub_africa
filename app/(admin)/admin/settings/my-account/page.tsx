import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MyAccountForm } from "@/components/admin/settings/my-account-form";

export default async function AdminMyAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string })?.role ?? "STAFF";
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      totpSecret: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      staff: {
        select: {
          position: true,
          departmentId: true,
          department: true,
          departmentObj: { select: { id: true, name: true } },
        },
      },
    },
  });
  const twoFaEnabled = !!user?.totpSecret;
  const position = user?.staff?.position ?? null;
  const departmentId = user?.staff?.departmentId ?? null;
  const department = user?.staff?.department ?? user?.staff?.departmentObj?.name ?? null;
  const joinedAt = user?.createdAt ?? null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Account</h1>
      <MyAccountForm
        name={user?.name ?? session.user.name ?? ""}
        email={user?.email ?? session.user.email ?? ""}
        phone={user?.phone ?? null}
        twoFaEnabled={twoFaEnabled}
        role={role}
        position={position}
        departmentId={departmentId}
        department={department}
        joinedAt={joinedAt}
      />
    </div>
  );
}
