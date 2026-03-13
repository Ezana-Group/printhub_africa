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
  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          payments: true,
          refunds: true,
        },
      },
      addresses: { select: { id: true, label: true, street: true, city: true } },
      primaryCorporateAccount: { select: { companyName: true, kraPin: true } },
      printQuotes: { orderBy: { createdAt: "desc" }, take: 50 },
      quotes: { orderBy: { createdAt: "desc" }, take: 50 },
      uploadedFiles: { orderBy: { createdAt: "desc" }, take: 50 },
      auditLogs: { orderBy: { timestamp: "desc" }, take: 100 },
    },
  });
  if (!user) notFound();

  // Also load Get a Quote requests that match this customer's email (e.g. submitted as guest)
  const quotesByEmail = await prisma.quote.findMany({
    where: {
      customerEmail: { equals: user.email, mode: "insensitive" },
      customerId: null,
      id: { notIn: user.quotes.map((q) => q.id) },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const allGetAQuoteQuotes = [
    ...user.quotes.map((q) => ({ ...q, source: "account" as const })),
    ...quotesByEmail.map((q) => ({ ...q, source: "email_match" as const })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);

  const totalSpent = user.orders.reduce(
    (sum, o) =>
      sum +
      o.payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((s, p) => s + Number(p.amount), 0),
    0
  );
  const totalRefunded = user.orders.reduce(
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
    orders: user.orders.map((o) => ({
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
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      street: a.street,
      city: a.city,
    })),
    corporateAccount: user.primaryCorporateAccount
      ? {
          companyName: user.primaryCorporateAccount.companyName,
          kraPin: user.primaryCorporateAccount.kraPin,
        }
      : null,
    quotes: user.printQuotes.map((q) => ({
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
    uploads: user.uploadedFiles.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      fileType: u.fileType,
      status: u.status,
      createdAt: u.createdAt,
      url: u.url ?? "",
    })),
    auditLogs: user.auditLogs.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      timestamp: a.timestamp,
    })),
  };

  return <CustomerDetailClient data={data} />;
}
