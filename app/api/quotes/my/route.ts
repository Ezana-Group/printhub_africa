import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUOTE_TYPE_DB_TO_API } from "@/lib/quote-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view your quotes." }, { status: 401 });
  }

  const quotes = await prisma.quote.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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
