import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SavedAddressesList } from "@/components/account/saved-addresses-list";

export default async function AccountSettingsAddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  let addresses: Awaited<ReturnType<typeof prisma.savedAddress.findMany>> = [];
  try {
    addresses = await prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
  } catch {
    // DB unavailable
  }

  const list = addresses.map((a) => ({
    id: a.id,
    label: a.label,
    recipientName: a.recipientName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    county: a.county,
    isDefault: a.isDefault,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Saved Addresses</h1>
        <Link
          href="/account/settings"
          className="text-sm text-primary hover:underline mt-1 inline-block"
        >
          ← Back to settings
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Save your delivery addresses for faster checkout. Max 5 saved addresses.
      </p>
      <SavedAddressesList addresses={list} />
    </div>
  );
}
