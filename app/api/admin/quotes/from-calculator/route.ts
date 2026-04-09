/**
 * POST /api/admin/quotes/from-calculator
 * Persistently save a quote generated from the Admin calculator.
 * Marks it as "SENT" automatically.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { getNextQuotePdfNumber } from "@/lib/next-invoice-number";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      clientName,
      clientPhone,
      clientEmail,
      selectedCustomerId,
      validUntil,
      type = "3d_printing",
      lines,
      totals,
      notes,
      status = "quoted",
    } = body;

    if (!clientName) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const quoteNumber = await getNextQuotePdfNumber();

    // Mapping validity days from validUntil date
    const validUntilDate = new Date(validUntil);
    const today = new Date();
    const diffTime = Math.abs(validUntilDate.getTime() - today.getTime());
    const validityDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 7;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        type: type === "3d" ? "three_d_print" : "large_format",
        status: status || "quoted",
        customerId: selectedCustomerId || null,
        customerName: clientName,
        customerEmail: clientEmail || "no-email@printhub.africa",
        customerPhone: clientPhone || null,
        projectName: body.projectName || lines[0]?.description || "Project",
        description: body.projectName || lines[0]?.description || "",
        quotedAmount: totals.finalTotal,
        quotedAt: new Date(),
        quoteValidityDays: validityDays,
        quoteBreakdown: JSON.stringify(lines),
        specifications: {
          calculatorLines: lines,
          totals: totals,
        },
        adminNotes: notes || "Generated from Admin Calculator",
      },
    });

    return NextResponse.json({ 
      success: true, 
      quoteId: quote.id, 
      quoteNumber: quote.quoteNumber 
    });
  } catch (error: any) {
    console.error("Create quote error:", error);
    return NextResponse.json({ error: error.message || "Failed to save quote" }, { status: 500 });
  }
}
