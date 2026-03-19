import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AddCardClient } from "./add-card-client";

export default async function AddCardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Add card</h1>
        <Link
          href="/account/settings/payment-methods"
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          ← Back to Payment Methods
        </Link>
      </div>
      <AddCardClient />
    </div>
  );
}
