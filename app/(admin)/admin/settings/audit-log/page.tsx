import { requireSuperAdmin } from "@/lib/auth-guard";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PLACEHOLDER_LOG = [
  { id: "1", at: "2025-03-04 14:32", user: "James K.", role: "ADMIN", action: "Updated Pricing", target: "Outdoor Vinyl rate", detail: "KES 800 → KES 950", ip: "41.80.xx.xx" },
  { id: "2", at: "2025-03-04 13:15", user: "Admin", role: "SUPER_ADMIN", action: "Login", target: "—", detail: "—", ip: "41.80.xx.xx" },
  { id: "3", at: "2025-03-04 11:00", user: "Jane M.", role: "STAFF", action: "Updated order", target: "#1234", detail: "Status → Shipped", ip: "41.80.xx.xx" },
  { id: "4", at: "2025-03-03 16:45", user: "James K.", role: "ADMIN", action: "Settings", target: "Business Profile", detail: "Contact email updated", ip: "41.80.xx.xx" },
  { id: "5", at: "2025-03-03 10:20", user: "Admin", role: "SUPER_ADMIN", action: "Invite staff", target: "new@example.com", detail: "—", ip: "41.80.xx.xx" },
];

export default async function AdminSettingsAuditLogPage() {
  await requireSuperAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Audit Log</h1>
      <p className="text-sm text-muted-foreground">
        Complete record of significant actions in the admin panel. Filter by user, action type, date range.
      </p>
      <SectionCard
        title="Filters & Export"
        description="Filter by user, action type, date range. Search by reference."
      >
        <div className="flex flex-wrap gap-2 items-center">
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" name="user">
            <option>All users</option>
            <option>Admin</option>
            <option>James K.</option>
            <option>Jane M.</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" name="actionType">
            <option>All action types</option>
            <option>Login</option>
            <option>Order</option>
            <option>Product</option>
            <option>Settings</option>
            <option>Finance</option>
          </select>
          <Input type="date" className="h-10 w-[140px]" name="from" />
          <Input type="date" className="h-10 w-[140px]" name="to" />
          <Button type="button" variant="outline" size="sm">Apply</Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" variant="outline" size="sm">Export CSV</Button>
          <Button type="button" variant="outline" size="sm">Export Excel</Button>
          <Button type="button" variant="outline" size="sm">Export PDF</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Retention: 365 days (configurable).</p>
      </SectionCard>
      <SectionCard title="Log entries" description="Timestamp, user, role, action, target, and details.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-2 font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left py-2 font-medium text-muted-foreground">User</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Action</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Target</th>
                <th className="text-left py-2 font-medium text-muted-foreground">Details</th>
                <th className="text-left py-2 font-medium text-muted-foreground">IP</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_LOG.map((row) => (
                <tr key={row.id} className="border-b border-[#E5E7EB]">
                  <td className="py-3">{row.at}</td>
                  <td className="py-3">{row.user}</td>
                  <td className="py-3">{row.role}</td>
                  <td className="py-3">{row.action}</td>
                  <td className="py-3">{row.target}</td>
                  <td className="py-3">{row.detail}</td>
                  <td className="py-3 text-muted-foreground">{row.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
