import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const REASONS = [
  "out_of_stock",
  "technical_issue",
  "customer_request",
  "pricing_error",
  "material_unavailable",
  "other",
] as const;

const bodySchema = z.object({
  reason: z.enum(REASONS),
  notes: z.string().max(1000).optional(),
  notify_customer: z.boolean().optional().default(true),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { reason, notes, notify_customer } = parsed.data;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: { select: { email: true, name: true } } },
  });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const allowedStatuses = ["new", "reviewing", "quoted", "accepted", "in_production"];
  if (!allowedStatuses.includes(quote.status)) {
    return NextResponse.json(
      { error: `Cannot cancel quote with status ${quote.status}` },
      { status: 400 }
    );
  }

  await prisma.quote.update({
    where: { id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: session!.user!.id,
      cancellationReason: reason,
      cancellationNotes: notes ?? null,
      cancelledByAdminId: session!.user!.id,
      rejectedAt: new Date(),
      rejectionReason: notes ?? `Cancelled by admin: ${reason}`,
    },
  });

  await prisma.quoteCancellation.create({
    data: {
      quoteId: id,
      cancelledBy: "admin",
      cancelledByUserId: session!.user!.id,
      reason,
      notes: notes ?? null,
      notificationSent: false,
    },
  });

  if (notify_customer && quote.customer?.email) {
    // TODO: send email to customer (e.g. sendQuoteCancelledByAdminEmail)
  }

  return NextResponse.json({ success: true, message: "Quote cancelled" });
}
