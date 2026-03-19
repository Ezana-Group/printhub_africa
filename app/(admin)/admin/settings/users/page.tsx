import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { DepartmentsManager } from "@/components/admin/settings/DepartmentsManager";
import { AboutPageTeamSection } from "@/components/admin/settings/AboutPageTeamSection";

export default async function AdminSettingsUsersPage() {
  await requireSuperAdmin();
  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "desc" },
    include: {
      staff: {
        select: {
          department: true,
          position: true,
          showOnAboutPage: true,
          publicName: true,
          publicRole: true,
        },
      },
    },
  });
  const visibleOnAbout = staff.filter((u) => u.staff?.showOnAboutPage).length;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Users & Roles</h1>
      <AboutPageTeamSection
        staff={staff.map((u) => ({
          id: u.id,
          name: u.name,
          staff: u.staff
            ? {
                showOnAboutPage: u.staff.showOnAboutPage,
                publicName: u.staff.publicName,
                publicRole: u.staff.publicRole,
              }
            : null,
        }))}
        visibleOnAbout={visibleOnAbout}
        totalStaff={staff.length}
      />
      <SectionCard
        title="Staff Accounts"
        description="Invite new staff. Roles: STAFF (limited), ADMIN (full except user mgmt), SUPER_ADMIN (unrestricted)."
      >
        <Button asChild>
          <Link href="/admin/staff">+ Invite New Staff Member</Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-2">Manage staff on the Staff page. Invite expires 48hrs.</p>
      </SectionCard>
      <SectionCard
        title="Admin Users"
        description="Staff and admins with access to this panel. Click a row to edit permissions."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Department</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Position</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-b border-[#E5E7EB] hover:bg-muted/50">
                  <td className="py-3">
                    <Link href={`/admin/staff/${u.id}`} className="font-medium hover:text-primary hover:underline">
                      {u.name ?? "—"}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">{u.email}</td>
                  <td className="py-3">{u.role}</td>
                  <td className="py-3">{u.staff?.department ?? "—"}</td>
                  <td className="py-3">{u.staff?.position ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      <SectionCard
        title="Permissions Matrix"
        description="Fine-grained permissions override per staff member. Edit via each user's profile."
      >
        <p className="text-sm text-muted-foreground">
          Permissions: Orders (View/Edit/Cancel/Refund), Products, Customers, Quotes, Finance, Inventory, Pricing, Marketing, Settings, Staff, Reports, Audit Log. Configure in Staff → [User] → Permissions.
        </p>
      </SectionCard>

      <SectionCard
        title="Departments"
        description="Manage departments used in the staff invite form and staff profiles."
      >
        <DepartmentsManager />
      </SectionCard>
    </div>
  );
}
