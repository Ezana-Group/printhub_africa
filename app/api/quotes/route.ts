import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptionsCustomer } from "@/lib/auth-customer";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateQuoteNumber, QUOTE_TYPE_API_TO_DB } from "@/lib/quote-utils";
import { sendQuoteReceivedEmail } from "@/lib/email";

const fileMetaSchema = z.object({
  url: z.string().url(),
  originalName: z.string().optional(),
  sizeBytes: z.number().optional(),
  uploadedAt: z.string().optional(),
});

const createBodySchema = z.object({
  type: z.enum(["large_format", "3d_print", "design_and_print"]),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(30).optional(),
  preferredContact: z.enum(["email", "whatsapp", "phone"]).optional(),
  projectName: z.string().max(200).optional(),
  description: z.string().max(10000).optional(),
  referenceFiles: z.array(z.string().min(1)).max(20).optional(),
  referenceFilesMeta: z.array(fileMetaSchema).max(20).optional(),
  uploadIds: z.array(z.string().cuid()).max(20).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  budgetRange: z.string().max(100).optional(),
  deadline: z.string().optional(),
  referralSource: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsCustomer);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const assignedTo = searchParams.get("assignedTo") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (assignedTo) where.assignedStaffId = assignedTo;
  if (search && search.trim()) {
    where.OR = [
      { quoteNumber: { contains: search.trim(), mode: "insensitive" } },
      { customerName: { contains: search.trim(), mode: "insensitive" } },
      { customerEmail: { contains: search.trim(), mode: "insensitive" } },
    ];
  }
  if (dateFrom || dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }
    where.createdAt = dateFilter;
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.quote.count({ where }),
  ]);

  const serialized = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    type: q.type,
    status: q.status,
    closedBy: q.closedBy,
    customerName: q.customerName,
    customerEmail: q.customerEmail,
    customerId: q.customerId,
    assignedStaffId: q.assignedStaffId,
    assignedStaff: q.assignedStaff
      ? { id: q.assignedStaff.id, name: q.assignedStaff.user?.name, email: q.assignedStaff.user?.email }
      : null,
    projectName: q.projectName,
    deadline: q.deadline?.toISOString() ?? null,
    quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
    createdAt: q.createdAt.toISOString(),
  }));

  return NextResponse.json({ quotes: serialized, total });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptionsCustomer);
    const raw = await req.json();
    const parsed = createBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const typeDb = QUOTE_TYPE_API_TO_DB[data.type];
    const quoteNumber = await generateQuoteNumber();
    const deadline = data.deadline
      ? new Date(data.deadline)
      : undefined;

    const specificationsJson =
      data.specifications != null
        ? (JSON.parse(JSON.stringify(data.specifications)) as Record<string, unknown>)
        : undefined;

    const referenceFilesMetaJson =
      Array.isArray(data.referenceFilesMeta) && data.referenceFilesMeta.length > 0
        ? (data.referenceFilesMeta as Record<string, unknown>[])
        : undefined;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        type: typeDb,
        status: "new",
        customerId: session?.user?.id ?? undefined,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? undefined,
        preferredContact: (data.preferredContact as "email" | "whatsapp" | "phone") ?? "email",
        projectName: data.projectName ?? undefined,
        description: data.description ?? undefined,
        referenceFiles: Array.isArray(data.referenceFiles) ? data.referenceFiles : [],
        referenceFilesMeta: (referenceFilesMetaJson ?? undefined) as Prisma.InputJsonValue | undefined,
        specifications: specificationsJson as Prisma.InputJsonValue,
        budgetRange: data.budgetRange ?? undefined,
        deadline: deadline ?? undefined,
        referralSource: data.referralSource ?? undefined,
      },
    });

    if (Array.isArray(data.uploadIds) && data.uploadIds.length > 0) {
      await prisma.uploadedFile.updateMany({
        where: { id: { in: data.uploadIds } },
        data: { quoteId: quote.id },
      });
    }

    const typeLabels: Record<string, string> = {
      large_format: "Large Format",
      three_d_print: "3D Print",
      design_and_print: "Design+Print",
    };

    // --- AUTOMATION TRIGGERS ---
    void Promise.all([
      // 1. Customer Email
      sendQuoteReceivedEmail(
        data.customerEmail,
        quote.quoteNumber,
        typeLabels[typeDb] ?? typeDb
      ),
      // 2. Staff Alerts (WhatsApp/Telegram)
      (async () => {
        const { n8n } = await import("@/lib/n8n");
        return n8n.staffAlert({
          type: 'NEW_QUOTE',
          title: `📄 New Quote Request #${quote.quoteNumber}`,
          message: `Type: ${typeLabels[typeDb] || typeDb}\nCustomer: ${quote.customerName}\nProject: ${quote.projectName || 'N/A'}\nBudget: ${quote.budgetRange || 'Unspecified'}`,
          urgency: 'medium',
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/quotes/${quote.id}`,
          targetRoles: ['STAFF', 'ADMIN']
        });
      })(),
      // 3. n8n Master Trigger
      (async () => {
        const { n8n } = await import("@/lib/n8n");
        return n8n.quoteSubmitted({
          quoteId: quote.id,
          customerEmail: quote.customerEmail,
          customerName: quote.customerName,
          quoteType: typeDb,
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/quotes/${quote.id}`
        });
      })()
    ]).catch((err) => console.error("Quote triggers error:", err));

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      message:
        "We've received your request. Our team will review it and get back to you within 1–2 business days.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const isPrisma = e && typeof e === "object" && "code" in e;
    console.error("Quote create error:", e);
    return NextResponse.json(
      {
        error: "Failed to submit quote. Please try again.",
        ...(process.env.NODE_ENV === "development" && { details: message, isPrisma }),
      },
      { status: 500 }
    );
  }
}
