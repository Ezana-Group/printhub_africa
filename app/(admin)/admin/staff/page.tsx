export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StaffAdminClient } from "@/components/admin/staff-admin-client";
import { requireAdminSection } from "@/lib/admin-route-guard";

const CAN_ADD_STAFF = ["ADMIN", "SUPER_ADMIN"];

interface SessionUser {
  id: string;
  role: string;
}

export default async function AdminStaffPage() {
  try {

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
    personalEmail: u.personalEmail ?? null,
    role: u.role,
    status: u.status ?? "ACTIVE",
    department: u.staff?.department ?? null,
    position: u.staff?.position ?? null,
    departmentObj: u.staff?.departmentObj
      ? { id: u.staff.departmentObj.id, name: u.staff.departmentObj.name, colour: u.staff.departmentObj.colour }
      : null,
    createdAt: u.createdAt,
    lastActiveAt: null as Date | null,
  }));

  const userId = session?.user ? (session.user as SessionUser).id : undefined;

  return (
    <StaffAdminClient
      staff={rows}
      canInvite={!!canInvite}
      currentUserId={userId}
    />
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
