import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { QUOTE_TYPE_DB_TO_API } from "@/lib/quote-utils";

export async function GET() {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your quotes." }, { status: 401 });
  }

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

  const serialized = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    type: QUOTE_TYPE_DB_TO_API[q.type],
    status: q.status,
    projectName: q.projectName,
    quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
    quotedAt: q.quotedAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  }));

  return NextResponse.json({ quotes: serialized });
}
