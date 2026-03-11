import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { QuotesListClient } from "@/components/account/quotes-list-client";
import { Button } from "@/components/ui/button";

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

  let list: Array<{
    id: string;
    quoteNumber: string;
    type: string;
    status: string;
    projectName: string | null;
    quotedAmount: number | null;
    quotedAt: string | null;
    createdAt: string;
  }>;

  try {
    const linkedQuotes = await prisma.quote.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
    });

    let guestQuotes: Awaited<ReturnType<typeof prisma.quote.findMany>> = [];
    if (userEmail) {
      try {
        guestQuotes = await prisma.quote.findMany({
          where: {
            customerId: null,
            customerEmail: { equals: userEmail },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch {
        guestQuotes = [];
      }
    }

    const seenIds = new Set(linkedQuotes.map((q) => q.id));
    const guestOnly = guestQuotes.filter((q) => !seenIds.has(q.id));
    const quotes = [...linkedQuotes, ...guestOnly].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    list = quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      type: q.type,
      status: q.status,
      projectName: q.projectName,
      quotedAmount: q.quotedAmount != null ? Number(String(q.quotedAmount)) : null,
      quotedAt: q.quotedAt instanceof Date ? q.quotedAt.toISOString() : null,
      createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (e) {
    console.error("Account quotes page error:", e);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Quotes</h1>
          <p className="text-sm text-slate-500 mt-0.5">View status and details of your quote requests.</p>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
          <p className="text-amber-800 font-medium">We couldn’t load your quotes.</p>
          <p className="text-sm text-amber-700 mt-1">This may be a temporary issue. Please try again.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/account/quotes">Try again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/account">Back to account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
