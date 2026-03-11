import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { QuotesListClient } from "@/components/account/quotes-list-client";

const TYPE_LABELS: Record<string, string> = {
  large_format: "Large Format",
  three_d_print: "3D Print",
  design_and_print: "Design+Print",
};

export default async function AccountQuotesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id as string;
  const userEmail = (session.user.email as string) ?? "";
  const [linkedQuotes, guestQuotes] = await Promise.all([
    prisma.quote.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    userEmail
      ? prisma.quote.findMany({
          where: {
            customerId: null,
            customerEmail: { equals: userEmail, mode: "insensitive" },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);
  const seenIds = new Set(linkedQuotes.map((q) => q.id));
  const guestOnly = guestQuotes.filter((q) => !seenIds.has(q.id));
  const quotes = [...linkedQuotes, ...guestOnly].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const list = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    type: q.type,
    status: q.status,
    projectName: q.projectName,
    quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
    quotedAt: q.quotedAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Quotes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View status and details of your quote requests.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-slate-500">You haven&apos;t submitted any quotes yet.</p>
          <Link
            href="/get-a-quote"
            className="mt-3 inline-block text-sm font-medium text-[#E8440A] hover:underline"
          >
            Get a quote →
          </Link>
        </div>
      ) : (
        <QuotesListClient
          quotes={list}
          typeLabels={TYPE_LABELS}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
