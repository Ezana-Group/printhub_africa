export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { prisma } from "@/lib/prisma";
import { InviteStaffPageClient } from "./invite-staff-page-client";

const CAN_INVITE_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default async function AdminStaffInvitePage() {
  try {

  await requireAdminSection("/admin/staff");
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!role || !CAN_INVITE_ROLES.includes(role)) {
    redirect("/admin/access-denied");
  }

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/staff" className="text-sm text-primary hover:underline">
          ← Back to Staff
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-[#111]">Invite Staff Member</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Work email must be @printhub.africa (used to sign in). Optionally send the invite to a personal inbox
          instead.
        </p>
      </div>
      <InviteStaffPageClient
        departments={departments}
        currentUserRole={role as "ADMIN" | "SUPER_ADMIN"}
      />
    </div>
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
