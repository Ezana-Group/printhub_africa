import { SectionCard } from "@/components/settings/section-card";
import { formatRelativeTime } from "@/lib/admin-utils";

const PLACEHOLDER_ACTIVITY = [
  { id: "1", action: "Viewed staff list", ref: "—", at: new Date(Date.now() - 1000 * 60 * 5) },
  { id: "2", action: "Updated order #1234", ref: "Status → Shipped", at: new Date(Date.now() - 1000 * 60 * 45) },
  { id: "3", action: "Logged in", ref: "—", at: new Date(Date.now() - 1000 * 60 * 120) },
  { id: "4", action: "Sent quote #567", ref: "PHUB-QT-567", at: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: "5", action: "Edited product", ref: "Business Cards A4", at: new Date(Date.now() - 1000 * 60 * 60 * 5) },
];

export default function AdminMyAccountActivityPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Activity</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <p className="text-2xl font-display font-bold">—</p>
          <p className="text-sm text-muted-foreground">Jobs completed (last 30 days)</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <p className="text-2xl font-display font-bold">—</p>
          <p className="text-sm text-muted-foreground">Quotes sent</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <p className="text-2xl font-display font-bold">—</p>
          <p className="text-sm text-muted-foreground">Files reviewed</p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <p className="text-2xl font-display font-bold">—</p>
          <p className="text-sm text-muted-foreground">Orders processed</p>
        </div>
      </div>
      <SectionCard
        title="Recent actions"
        description="Last 20 admin actions. Timestamp, action, and reference."
      >
        <ul className="divide-y divide-[#E5E7EB]">
          {PLACEHOLDER_ACTIVITY.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground shrink-0">{formatRelativeTime(item.at)}</span>
              <span className="font-medium">{item.action}</span>
              {item.ref !== "—" && <span className="text-muted-foreground">{item.ref}</span>}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
