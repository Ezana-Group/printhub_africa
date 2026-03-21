export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { CustomerDetailClient } from "@/components/admin/customer-detail-client";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/customers");
  const { id } = await params;
  async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[admin/customers/${id}] Failed to load ${label}:`, error);
      return fallback;
    }
  }

  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      _count: { select: { orders: true } },
      primaryCorporateAccount: {
        select: {
          id: true,
          accountNumber: true,
          companyName: true,
          tradingName: true,
          tier: true,
          status: true,
          discountPercent: true,
          creditLimit: true,
          creditUsed: true,
          paymentTerms: true,
          kraPin: true,
          industry: true,
        },
      },
      corporateTeamMemberships: {
        where: { isActive: true },
        include: {
          corporate: {
            select: {
              id: true,
              accountNumber: true,
              companyName: true,
              tradingName: true,
              tier: true,
              status: true,
              discountPercent: true,
              creditLimit: true,
              creditUsed: true,
              paymentTerms: true,
              kraPin: true,
              industry: true,
            },
          },
        },
        take: 1,
      },
    },
  });
  if (!user) notFound();

  const [orders, addresses, printQuotes, quotes, uploadedFiles, auditLogs] = await Promise.all([
    safeQuery(
      "orders",
      () =>
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            payments: true,
            refunds: true,
          },
        }),
      []
    ),
    safeQuery(
      "addresses",
      () =>
        prisma.address.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, label: true, street: true, city: true },
        }),
      []
    ),
    safeQuery(
      "printQuotes",
      () =>
        prisma.printQuote.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      []
    ),
    safeQuery(
      "quotes",
      () =>
        prisma.quote.findMany({
          where: { customerId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      []
    ),
    safeQuery(
      "uploadedFiles",
      () =>
        prisma.uploadedFile.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      []
    ),
    safeQuery(
      "auditLogs",
      () =>
        prisma.auditLog.findMany({
          where: { userId: user.id },
          orderBy: { timestamp: "desc" },
          take: 100,
        }),
      []
    ),
  ]);

  // Also load Get a Quote requests that match this customer's email (e.g. submitted as guest)
  const quotesByEmail = await safeQuery(
    "quotesByEmail",
    () =>
      prisma.quote.findMany({
        where: {
          customerEmail: user.email,
          customerId: null,
          id: { notIn: quotes.map((q) => q.id) },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    []
  );
  const allGetAQuoteQuotes = [
    ...quotes.map((q) => ({ ...q, source: "account" as const })),
    ...quotesByEmail.map((q) => ({ ...q, source: "email_match" as const })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);

  const totalSpent = orders.reduce(
    (sum, o) =>
      sum +
      o.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((s, p) => s + Number(p.amount), 0),
    0
  );
  const totalRefunded = orders.reduce(
    (sum, o) =>
      sum +
      o.refunds
        .filter((r) => r.status === "COMPLETED")
        .reduce((s, r) => s + Number(r.amount), 0),
    0
  );

  const data = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    preferredLanguage: user.preferredLanguage,
    loyaltyPoints: user.loyaltyPoints,
    ordersCount: user._count.orders,
    totalSpent,
    totalRefunded,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      createdAt: o.createdAt,
      payments: o.payments.map((p) => ({
        provider: p.provider,
        amount: Number(p.amount),
        status: p.status,
      })),
      refunds: o.refunds.map((r) => ({
        amount: Number(r.amount),
        status: r.status,
        reason: r.reason,
      })),
    })),
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      street: a.street,
      city: a.city,
    })),
    corporateAccount: (() => {
      const acc =
        user.primaryCorporateAccount ??
        user.corporateTeamMemberships[0]?.corporate ??
        null;
      if (!acc) return null;
      return {
        id: acc.id,
        accountNumber: acc.accountNumber,
        companyName: acc.companyName,
        tradingName: acc.tradingName,
        tier: acc.tier,
        status: acc.status,
        discountPercent: acc.discountPercent,
        creditLimit: acc.creditLimit,
        creditUsed: acc.creditUsed,
        paymentTerms: acc.paymentTerms,
        kraPin: acc.kraPin,
        industry: acc.industry,
      };
    })(),
    corporateRole: user.corporateTeamMemberships[0]?.role ?? null,
    quotes: printQuotes.map((q) => ({
      id: q.id,
      status: q.status,
      estimatedCost: q.estimatedCost != null ? Number(q.estimatedCost) : null,
      createdAt: q.createdAt,
      validUntil: q.validUntil,
    })),
    getAQuoteQuotes: allGetAQuoteQuotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      type: q.type,
      status: q.status,
      quotedAmount: q.quotedAmount != null ? Number(q.quotedAmount) : null,
      createdAt: q.createdAt,
      projectName: q.projectName,
    })),
    uploads: uploadedFiles.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      fileType: u.fileType,
      status: u.status,
      createdAt: u.createdAt,
      url: u.url ?? "",
    })),
    auditLogs: auditLogs.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      timestamp: a.timestamp,
    })),
  };

  return <CustomerDetailClient data={data} />;
}
