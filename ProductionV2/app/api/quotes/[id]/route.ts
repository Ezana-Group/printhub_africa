import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);
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

  const isOwner = session?.user?.id === quote.customerId;
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
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const role = (session.user as { role?: string })?.role;
  const isStaff = ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role ?? "");

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { assignedStaff: { select: { user: { select: { email: true } } } } },
  });
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const isOwner = session.user.id === quote.customerId;

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
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden. Super Admin only." }, { status: 403 });
  }

  const { id } = await params;
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
