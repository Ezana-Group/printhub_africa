import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptionsCustomer } from "@/lib/auth-customer";
import { prisma } from "@/lib/prisma";
import { QUOTE_TYPE_DB_TO_API } from "@/lib/quote-utils";
import {
  sendQuoteSentToCustomerEmail,
  sendStaffQuoteAcceptedEmail,
  sendStaffQuoteAssignedEmail,
  sendQuoteInProductionEmail,
} from "@/lib/email";

const patchSchema = z.object({
  status: z.enum(["new", "reviewing", "quoted", "accepted", "rejected", "in_production", "completed", "cancelled"]).optional(),
  assignedStaffId: z.string().cuid().nullable().optional(),
  quotedAmount: z.number().min(0).optional(),
  quoteBreakdown: z.string().max(5000).optional(),
  quoteValidityDays: z.number().int().min(1).optional(),
  quotePdfUrl: z.string().url().optional(),
  deadline: z.union([z.string(), z.null()]).optional(),
  rejectionReason: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  adminNotes: z.string().max(5000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  const { id } = await params;
  const role = (session?.user as { role?: string })?.role;
  const isStaff = session?.user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      assignedStaff: { select: { id: true, user: { select: { name: true, email: true } } } },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const isOwner =
    session?.user?.id === quote.customerId ||
    (quote.customerId === null &&
      session?.user?.email &&
      quote.customerEmail.toLowerCase() === (session.user.email as string).toLowerCase());
  if (!isStaff && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serialized = {
    ...quote,
    type: QUOTE_TYPE_DB_TO_API[quote.type],
    quotedAmount: quote.quotedAmount != null ? Number(quote.quotedAmount) : null,
    deadline: quote.deadline?.toISOString() ?? null,
    quotedAt: quote.quotedAt?.toISOString() ?? null,
    acceptedAt: quote.acceptedAt?.toISOString() ?? null,
    rejectedAt: quote.rejectedAt?.toISOString() ?? null,
    createdAt: quote.createdAt.toISOString(),
    updatedAt: quote.updatedAt.toISOString(),
    adminNotes: isStaff ? quote.adminNotes : undefined,
  };

  return NextResponse.json(serialized);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const role = (session.user as { role?: string })?.role;
  const isStaff = ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { assignedStaff: { select: { user: { select: { email: true } } } } },
  });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const isOwner =
    session.user.id === quote.customerId ||
    (quote.customerId === null &&
      session.user.email &&
      quote.customerEmail?.toLowerCase() === (session.user.email as string).toLowerCase());

  const raw = await req.json();

  if (!isStaff && isOwner) {
    const z = await import("zod");
    const customerSchema = z.object({ status: z.enum(["accepted", "rejected"]) });
    const parsed = customerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (quote.status !== "quoted") {
      return NextResponse.json({ error: "Quote is not in quoted status" }, { status: 400 });
    }
    const quoteUpdated = await prisma.quote.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === "accepted" && { acceptedAt: new Date() }),
        ...(parsed.data.status === "rejected" && { rejectedAt: new Date() }),
      },
    });
    if (parsed.data.status === "accepted") {
      const staffEmail = quote.assignedStaff?.user?.email;
      const amount = quote.quotedAmount != null ? Number(quote.quotedAmount) : 0;
      if (staffEmail) {
        void sendStaffQuoteAcceptedEmail(
          staffEmail,
          quote.quoteNumber,
          quote.customerName,
          amount
        ).catch((err) => console.error("Staff quote accepted email error:", err));
      }
    }
    return NextResponse.json({
      success: true,
      quote: { id: quoteUpdated.id, quoteNumber: quoteUpdated.quoteNumber, status: quoteUpdated.status },
    });
  }

  if (!isStaff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Customer-closed quotes cannot be modified by admin
  if (quote.closedBy === "CUSTOMER") {
    return NextResponse.json(
      {
        error: "This quote was closed by the customer and cannot be modified.",
        code: "QUOTE_CUSTOMER_CLOSED",
        detail: quote.closedReason
          ? `${quote.closedReason}${quote.closedAt ? ` on ${quote.closedAt.toISOString()}` : ""}`
          : "Quote was closed by the customer.",
      },
      { status: 403 }
    );
  }
  const customerClosedPhrases = [
    "withdrawn by customer",
    "declined by customer",
    "customer declined",
    "customer withdrew",
  ];
  const isLegacyCustomerClose =
    (quote.status === "rejected" || quote.status === "cancelled") &&
    quote.rejectionReason &&
    customerClosedPhrases.some((phrase) =>
      quote.rejectionReason!.toLowerCase().includes(phrase)
    );
  if (isLegacyCustomerClose && !quote.closedBy) {
    return NextResponse.json(
      {
        error: "This quote was closed by the customer and cannot be modified.",
        code: "QUOTE_CUSTOMER_CLOSED",
        detail: quote.rejectionReason ?? undefined,
      },
      { status: 403 }
    );
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.deadline !== undefined) {
    updatePayload.deadline = data.deadline === null || data.deadline === "" ? null : new Date(data.deadline as string);
  }
  if (data.status === "quoted" && data.quotedAmount != null) {
    updatePayload.quotedAt = new Date();
  }
  if (data.status === "accepted") {
    updatePayload.acceptedAt = new Date();
  }
  if (data.status === "rejected" && data.rejectionReason) {
    updatePayload.rejectedAt = new Date();
  }

  const quoteUpdated = await prisma.quote.update({
    where: { id },
    data: updatePayload as never,
  });

  if (data.status === "quoted" && data.quotedAmount != null && data.quotedAmount > 0) {
    void sendQuoteSentToCustomerEmail(
      quote.customerEmail,
      quote.quoteNumber,
      data.quotedAmount,
      data.quoteBreakdown ?? null,
      data.quoteValidityDays ?? null
    ).catch((err) => console.error("Quote sent to customer email error:", err));
  }

  if (data.status === "in_production") {
    void sendQuoteInProductionEmail(quote.customerEmail, quote.quoteNumber).catch((err) =>
      console.error("Quote in production email error:", err)
    );

    // ── Filament deduction ──────────────────────────────────────────────────
    // Only applies to 3D print quotes. Extract per-material weight from the
    // calculator lines stored in specifications.calculatorLines, then decrement
    // the matching ThreeDConsumable and log a movement record.
    if (quote.type === "three_d_print") {
      void (async () => {
        try {
          const specs = quote.specifications as Record<string, unknown> | null;
          const lines = (specs?.calculatorLines ?? []) as Array<{
            materialCode?: string;
            materialName?: string;
            weightGrams?: number;
            quantity?: number;
          }>;

          if (!lines.length) return;

          // Sum total grams per material code
          const gramsByMaterial: Record<string, { totalGrams: number; name: string }> = {};
          for (const line of lines) {
            const code = (line.materialCode ?? line.materialName ?? "unknown").toLowerCase();
            const grams = (line.weightGrams ?? 0) * (line.quantity ?? 1);
            if (!gramsByMaterial[code]) gramsByMaterial[code] = { totalGrams: 0, name: line.materialName ?? code };
            gramsByMaterial[code].totalGrams += grams;
          }

          for (const [code, { totalGrams, name }] of Object.entries(gramsByMaterial)) {
            if (totalGrams <= 0) continue;

            // Find the consumable — match by kind or name (case-insensitive)
            const consumable = await prisma.threeDConsumable.findFirst({
              where: {
                OR: [
                  { kind: { equals: code, mode: "insensitive" } },
                  { name: { contains: code, mode: "insensitive" } },
                  { kind: { contains: name, mode: "insensitive" } },
                ],
              },
            });

            if (!consumable) continue;

            // Log the movement (negative = usage/deduction)
            await prisma.threeDConsumableMovement.create({
              data: {
                consumableId: consumable.id,
                type: "PRINT_DEDUCTION",
                quantity: -Math.round(totalGrams), // grams used (negative)
                notes: `Auto-deducted ${Math.round(totalGrams)}g for quote ${quote.quoteNumber} → In Production`,
                reference: quote.quoteNumber,
              },
            });

            // Decrement consumable quantity only when a full spool is consumed
            // (quantity = number of spools; weightPerSpoolKg converts to grams)
            if (consumable.weightPerSpoolKg && consumable.weightPerSpoolKg > 0) {
              const gramsPerSpool = consumable.weightPerSpoolKg * 1000;
              const spoolsUsed = Math.floor(totalGrams / gramsPerSpool);
              if (spoolsUsed >= 1) {
                await prisma.threeDConsumable.update({
                  where: { id: consumable.id },
                  data: { quantity: { decrement: spoolsUsed } },
                });
              }
            }
          }
        } catch (err) {
          console.error("[Filament deduction] Error:", err);
        }
      })();
    }
    // ────────────────────────────────────────────────────────────────────────
  }

  if (data.assignedStaffId !== undefined && data.assignedStaffId !== quote.assignedStaffId && data.assignedStaffId) {
    const assigned = await prisma.staff.findUnique({
      where: { id: data.assignedStaffId },
      include: { user: { select: { email: true } } },
    });
    const typeLabels: Record<string, string> = {
      large_format: "Large Format",
      three_d_print: "3D Print",
      design_and_print: "I Have an Idea",
    };
    if (assigned?.user?.email) {
      void sendStaffQuoteAssignedEmail(
        assigned.user.email,
        quote.quoteNumber,
        quote.customerName,
        typeLabels[quote.type] ?? quote.type
      ).catch((err) => console.error("Staff quote assigned email error:", err));
    }
  }

  return NextResponse.json({
    success: true,
    quote: {
      id: quoteUpdated.id,
      quoteNumber: quoteUpdated.quoteNumber,
      status: quoteUpdated.status,
      quotedAmount: quoteUpdated.quotedAmount != null ? Number(quoteUpdated.quotedAmount) : null,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsCustomer);
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden. Super Admin only." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
