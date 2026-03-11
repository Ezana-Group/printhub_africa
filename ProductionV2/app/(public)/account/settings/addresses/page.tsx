import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AddressesSettingsClient } from "./addresses-settings-client";

export default async function AccountSettingsAddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Saved Addresses</h1>
        <Link
          href="/account"
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          ← Back to account
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Save your delivery addresses for faster checkout. Max 5 saved addresses.
      </p>
      <AddressesSettingsClient />
    </div>
  );
}
