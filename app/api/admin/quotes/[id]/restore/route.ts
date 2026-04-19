import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  if (quote.status !== "cancelled") {
    return NextResponse.json(
      { error: "Quote is not cancelled" },
      { status: 400 }
    );
  }
  if (quote.closedBy === "CUSTOMER") {
    return NextResponse.json(
      {
        error: "This quote was closed by the customer and cannot be restored.",
        code: "QUOTE_CUSTOMER_CLOSED",
        detail: quote.closedReason ?? "Closed by the customer.",
      },
      { status: 403 }
    );
  }

  await prisma.quote.update({
    where: { id },
    data: {
      status: "reviewing",
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      cancellationNotes: null,
      cancelledByAdminId: null,
      rejectedAt: null,
      rejectionReason: null,
      closedBy: null,
      closedAt: null,
      closedReason: null,
    },
  });

  return NextResponse.json({ success: true, message: "Quote restored to Under Review" });
}
