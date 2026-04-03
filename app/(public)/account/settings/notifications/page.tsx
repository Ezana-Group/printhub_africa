export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationSettingsClient } from "./notification-settings-client";

import { prisma } from "@/lib/prisma";

export default async function AccountSettingsNotificationsPage() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { smsMarketingOptIn: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <Link
          href="/account"
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          ← Back to account
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose what you hear about and how we reach you.
      </p>
      <NotificationSettingsClient initialSmsOptIn={user.smsMarketingOptIn} />
    </div>
  );
}
