import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  const { searchParams } = new URL(req.url);
  const quoteId = searchParams.get("quoteId");

  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: { select: { name: true, email: true, orders: { take: 3 } } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      projectName: quote.projectName,
      description: quote.description,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      budgetRange: quote.budgetRange,
      deadline: quote.deadline,
      specifications: quote.specifications,
      notes: quote.notes,
      recentOrders: quote.customer?.orders || [],
    });
  } catch (err) {
    console.error("[get-quote-context]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
