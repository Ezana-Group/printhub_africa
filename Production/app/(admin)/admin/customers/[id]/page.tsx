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
      corporateAccount: { select: { companyName: true, kraPin: true } },
      printQuotes: { orderBy: { createdAt: "desc" }, take: 50 },
      uploadedFiles: { orderBy: { createdAt: "desc" }, take: 50 },
      auditLogs: { orderBy: { timestamp: "desc" }, take: 100 },
    },
  });
  if (!user) notFound();

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
    corporateAccount: user.corporateAccount
      ? {
          companyName: user.corporateAccount.companyName,
          kraPin: user.corporateAccount.kraPin,
        }
      : null,
    quotes: user.printQuotes.map((q) => ({
      id: q.id,
      status: q.status,
      estimatedCost: q.estimatedCost != null ? Number(q.estimatedCost) : null,
      createdAt: q.createdAt,
      validUntil: q.validUntil,
    })),
    uploads: user.uploadedFiles.map((u) => ({
      id: u.id,
      originalName: u.originalName,
      fileType: u.fileType,
      status: u.status,
      createdAt: u.createdAt,
      url: u.url,
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
