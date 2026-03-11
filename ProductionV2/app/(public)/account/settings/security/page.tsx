import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SecuritySettingsClient } from "./security-settings-client";

export default async function AccountSettingsSecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Security</h1>
        <Link
          href="/account"
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          ← Back to account
        </Link>
      </div>
      <SecuritySettingsClient />
    </div>
  );
}
