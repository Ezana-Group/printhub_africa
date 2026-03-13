import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
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
    },
  });

  return NextResponse.json({ success: true, message: "Quote restored to Under Review" });
}
