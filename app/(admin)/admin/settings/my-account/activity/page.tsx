import { MyActivityClient } from "@/components/admin/my-activity-client";

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
      <MyActivityClient />
    </div>
  );
}
