export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { StaffDetailTabs } from "@/components/admin/staff-detail-tabs";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";
import { getInitials, nameToHue, getStaffRoleLabel } from "@/lib/admin-utils";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export default async function AdminStaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {

  await requireAdminSection("/admin/staff");
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "STAFF";
  const canEditStaff = ADMIN_ROLES.includes(role);

  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    include: {
      staff: {
        include: {
          departmentObj: { select: { id: true, name: true, colour: true } },
        },
      },
    },
  });
  if (!user) notFound();

  const displayName = user.name ?? "Staff";
  const hue = nameToHue(user.email);

  const staffUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    personalEmail: user.personalEmail ?? null,
    phone: user.phone,
    role: user.role,
    status: user.status ?? "ACTIVE",
    emailVerified: user.emailVerified?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    staff: user.staff
      ? {
          department: user.staff.department,
          departmentId: user.staff.departmentId,
          departmentObj: user.staff.departmentObj
            ? { id: user.staff.departmentObj.id, name: user.staff.departmentObj.name, colour: user.staff.departmentObj.colour }
            : null,
          position: user.staff.position,
          permissions: user.staff.permissions,
          showOnAboutPage: user.staff.showOnAboutPage,
          aboutPageOrder: user.staff.aboutPageOrder,
          publicName: user.staff.publicName,
          publicRole: user.staff.publicRole,
          publicBio: user.staff.publicBio,
          profilePhotoUrl: user.staff.profilePhotoUrl,
        }
      : null,
  };

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <AdminBreadcrumbs
        items={[
          { label: "Staff", href: "/admin/staff" },
          { label: displayName },
        ]}
      />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-full shrink-0 flex items-center justify-center text-white text-lg font-semibold"
            style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}
          >
            {getInitials(user.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-bold text-[#111]">{displayName}</h1>
              {(user.status ?? "ACTIVE") === "INVITE_PENDING" && (
                <span className="text-xs font-medium rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 border border-amber-200">
                  Invite pending
                </span>
              )}
              {(user.status ?? "ACTIVE") === "DEACTIVATED" && (
                <span className="text-xs font-medium rounded-full bg-[#F3F4F6] text-[#6B7280] px-2.5 py-0.5 border border-[#E5E7EB]">
                  Suspended
                </span>
              )}
            </div>
            <p className="text-sm text-[#6B7280]">
              {getStaffRoleLabel(user.role)} {user.staff?.department && `· ${user.staff.department}`}
            </p>
            <p className="text-[13px] text-[#6B7280]">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* AUDIT FIX: Edit links to profile section on same page (no separate edit route yet) */}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/staff/${id}#profile`}>Edit</Link>
          </Button>
          <ResetPasswordButton
            staffId={id}
            staffEmail={user.email ?? ""}
            invitePending={(user.status ?? "ACTIVE") === "INVITE_PENDING"}
          />
        </div>
      </div>

      <StaffDetailTabs
        user={staffUser}
        canEditProfile={canEditStaff}
        canEditPermissions={canEditStaff}
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
