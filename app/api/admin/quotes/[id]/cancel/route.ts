import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendQuoteCancelledByAdminEmail } from "@/lib/email";

const REASONS = [
  "out_of_stock",
  "technical_issue",
  "customer_request",
  "pricing_error",
  "material_unavailable",
  "other",
  "unable_to_fulfil",
  "file_quality",
  "no_response",
  "pricing_dispute",
  "duplicate",
  "policy_violation",
  "custom",
] as const;

const REASON_LABELS: Record<string, string> = {
  out_of_stock: "Out of stock",
  technical_issue: "Technical issue",
  customer_request: "Customer request",
  pricing_error: "Pricing error",
  material_unavailable: "Material unavailable",
  other: "Other",
  unable_to_fulfil: "Unable to fulfil — material or equipment not available",
  file_quality: "File quality issue — customer submitted unusable files",
  no_response: "No customer response — quote expired without reply",
  pricing_dispute: "Pricing dispute — customer rejected final price",
  duplicate: "Duplicate submission — customer submitted same request twice",
  policy_violation: "Policy violation — content not permitted for printing",
  custom: "Other reason (specify in notes)",
};

const bodySchema = z.object({
  reason: z.enum(REASONS),
  notes: z.string().max(1000).optional(),
  custom_reason: z.string().max(1000).optional(),
  message_to_customer: z.string().max(2000).optional(),
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
  const { reason, notes, custom_reason, message_to_customer, notify_customer } = parsed.data;
  const cancellationReasonLabel =
    reason === "custom" && custom_reason?.trim()
      ? custom_reason.trim()
      : REASON_LABELS[reason] ?? reason;
  const cancellationNotes = [notes?.trim(), message_to_customer?.trim()].filter(Boolean).join("\n\n") || null;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: { select: { email: true, name: true } } },
  });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.closedBy === "CUSTOMER") {
    return NextResponse.json(
      {
        error: "This quote was closed by the customer and cannot be modified.",
        code: "QUOTE_CUSTOMER_CLOSED",
        detail: quote.closedReason ?? "Closed by the customer.",
      },
      { status: 403 }
    );
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
      cancellationReason: cancellationReasonLabel,
      cancellationNotes,
      cancelledByAdminId: session!.user!.id,
      rejectedAt: new Date(),
      rejectionReason: cancellationNotes ?? `Cancelled by admin: ${cancellationReasonLabel}`,
      closedBy: "STAFF",
      closedAt: new Date(),
      closedReason: `Cancelled by staff: ${cancellationReasonLabel}`,
    },
  });

  await prisma.quoteCancellation.create({
    data: {
      quoteId: id,
      cancelledBy: "admin",
      cancelledByUserId: session!.user!.id,
      reason: cancellationReasonLabel,
      notes: cancellationNotes,
      notificationSent: !!(notify_customer && quote.customer?.email),
    },
  });

  if (notify_customer && quote.customer?.email) {
    try {
      await sendQuoteCancelledByAdminEmail(
        quote.customer.email,
        quote.quoteNumber,
        cancellationReasonLabel,
        message_to_customer?.trim() || null
      );
    } catch (e) {
      console.error("Failed to send quote cancellation email:", e);
    }
  }

  return NextResponse.json({ success: true, message: "Quote cancelled" });
}
