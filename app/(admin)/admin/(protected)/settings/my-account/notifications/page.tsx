export const dynamic = 'force-dynamic'
import { MyNotificationsClient } from "@/components/admin/my-notifications-client";

export default function AdminMyAccountNotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Notifications</h1>
      <MyNotificationsClient />
    </div>
  );
}
