import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StaffAdminClient } from "@/components/admin/staff-admin-client";
import { requireAdminSection } from "@/lib/admin-route-guard";

const CAN_ADD_STAFF = ["ADMIN", "SUPER_ADMIN"];

export default async function AdminStaffPage() {
  await requireAdminSection("/admin/staff");
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const canInvite = role && CAN_ADD_STAFF.includes(role);

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "desc" },
    include: {
      staff: {
        select: {
          department: true,
          position: true,
          departmentObj: { select: { id: true, name: true, colour: true } },
        },
      },
    },
  });

  const rows = staff.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.staff?.department ?? null,
    position: u.staff?.position ?? null,
    departmentObj: u.staff?.departmentObj
      ? { id: u.staff.departmentObj.id, name: u.staff.departmentObj.name, colour: u.staff.departmentObj.colour }
      : null,
    createdAt: u.createdAt,
    lastActiveAt: null as Date | null,
  }));

  return <StaffAdminClient staff={rows} canInvite={!!canInvite} />;
}
