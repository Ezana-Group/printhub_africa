export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CorporateAccountClient } from "./corporate-account-client";

export default async function AccountSettingsCorporatePage() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Corporate Account</h1>
        <Link
          href="/account"
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          ← Back to account
        </Link>
      </div>
      <CorporateAccountClient />
    </div>
  );
}
