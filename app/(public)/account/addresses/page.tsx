import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AccountAddressesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  let addresses: Awaited<ReturnType<typeof prisma.address.findMany>> = [];
  try {
    addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    // DB unavailable
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-slate-900">Addresses</h1>
      <p className="text-slate-600 mt-1">Manage your saved delivery addresses.</p>
      <Link href="/account" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to account</Link>

      {addresses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No saved addresses yet.</p>
          <p className="text-sm text-slate-500 mt-1">Addresses are saved when you checkout.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900">{a.label}{a.isDefault ? " (Default)" : ""}</p>
              <p className="mt-1 text-slate-600 text-sm">
                {a.street}, {a.city}, {a.county} {a.postalCode ?? ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
}
