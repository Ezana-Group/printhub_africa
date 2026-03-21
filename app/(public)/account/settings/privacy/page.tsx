export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrivacyDataClient } from "./privacy-data-client";

export default async function PrivacyDataPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Privacy & data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Under the Kenya Data Protection Act 2019 you can export or delete your personal data.
        </p>
      </div>
      <PrivacyDataClient />
    </div>
  );
}
