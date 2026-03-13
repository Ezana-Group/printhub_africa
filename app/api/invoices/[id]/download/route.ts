/**
 * GET /api/invoices/[id]/download
 * Returns invoice as PDF. Allowed: order owner or admin.
 * Serves from R2 when invoice.pdfKey is set; otherwise generates on the fly.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer, isR2Configured } from "@/lib/r2";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: invoiceId } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      pdfKey: true,
      orderId: true,
      order: {
        select: { userId: true },
      },
    },
  });
  if (!invoice?.order) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id && invoice.order.userId === session.user.id;
  const isAdmin = (session?.user as { role?: string })?.role && ["ADMIN", "SUPER_ADMIN", "STAFF"].includes((session?.user as { role?: string }).role ?? "");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const headers = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    "Cache-Control": "private, max-age=60",
  };

  if (invoice.pdfKey && isR2Configured()) {
    try {
      const pdfBuffer = await getObjectBuffer("private", invoice.pdfKey);
      if (pdfBuffer) {
        return new NextResponse(pdfBuffer, { headers });
      }
    } catch (e) {
      console.error("Invoice PDF R2 fetch failed, falling back to generate:", e);
    }
  }

  try {
    const pdfBuffer = await generateInvoicePdfBuffer(invoiceId);
    if (!pdfBuffer) {
      return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
    return new NextResponse(pdfBuffer, { headers });
  } catch (e) {
    console.error("PDF generation error:", e);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
