/**
 * GET /api/quotes/[id]/pdf — download quote as PDF. Allowed: quote owner or admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuotePdfBuffer } from "@/lib/quote-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: quoteId } = await context.params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, quoteNumber: true, customerId: true, customerEmail: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const isOwner =
    (session?.user?.id && quote.customerId === session.user.id) ||
    (quote.customerId === null && session?.user?.email === quote.customerEmail);
  const isAdmin = (session?.user as { role?: string })?.role && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session?.user as { role?: string })?.role ?? "");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pdfBuffer = await generateQuotePdfBuffer(quoteId);
    if (!pdfBuffer) {
      return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quote-${quote.quoteNumber}.pdf"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    console.error("Quote PDF generation error:", e);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
