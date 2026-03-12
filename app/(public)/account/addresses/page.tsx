import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SavedAddressesList } from "@/components/account/saved-addresses-list";

export default async function AccountAddressesPage() {
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
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-slate-900">Addresses</h1>
      <p className="text-slate-600 mt-1">Your saved delivery addresses. They are used at checkout; you can change or add more when you place an order.</p>
      <Link href="/account" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to account</Link>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No saved addresses yet.</p>
          <p className="text-sm text-slate-500 mt-1">Addresses are saved to your profile when you checkout. You can also add one when you place your next order.</p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Go to shop</Link>
        </div>
      ) : (
        <SavedAddressesList addresses={list} />
      )}
      </div>
    </div>
  );
}
