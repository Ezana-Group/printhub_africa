export const dynamic = 'force-dynamic'
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import { formatKES } from "@/lib/utils";

export default async function AdminCorporateAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSection("/admin/corporate");
  const { id } = await params;

  const account = await prisma.corporateAccount.findUnique({
    where: { id },
    include: {
      primaryUser: { select: { id: true, name: true, email: true, phone: true } },
      teamMembers: {
        where: { isActive: true },
        include: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!account) notFound();

  const spend = await prisma.order.aggregate({
    where: { corporateId: id, status: { not: "CANCELLED" } },
    _sum: { total: true },
    _count: { id: true },
  });

  return (
    <div className="p-6">
      <AdminBreadcrumbs
        items={[
          { label: "Corporate", href: "/admin/corporate" },
          { label: account.companyName },
        ]}
      />
      <div className="mt-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{account.companyName}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{account.accountNumber}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{account.tier}</span>
              <span className="rounded-full bg-muted px-2 py-0.5">{account.status}</span>
            </div>
          </div>
        </div>
        <Link
          href={`/admin/orders/new?customerId=${account.primaryUserId}&corporateId=${account.id}`}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Order
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total orders
            </p>
            <p className="mt-1 text-2xl font-bold">{spend._count.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total spend
            </p>
            <p className="mt-1 text-2xl font-bold">
              {formatKES(Number(spend._sum.total ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Credit used
            </p>
            <p className="mt-1 text-2xl font-bold">
              {account.creditLimit > 0
                ? `${Math.round((account.creditUsed / account.creditLimit) * 100)}%`
                : "—"}
            </p>
            {account.creditLimit > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatKES(account.creditUsed)} / {formatKES(account.creditLimit)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Team members
            </p>
            <p className="mt-1 text-2xl font-bold">{account.teamMembers.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">{account.discountPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment terms</span>
              <span className="font-medium">{account.paymentTerms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KRA PIN</span>
              <span className="font-mono text-xs">{account.kraPin}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Primary contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{account.primaryUser?.name ?? "—"}</p>
            <p className="text-muted-foreground">{account.primaryUser?.email}</p>
            {account.primaryUser?.phone && (
              <p className="text-muted-foreground">{account.primaryUser.phone}</p>
            )}
            {account.primaryUserId && (
              <Link
                href={`/admin/customers/${account.primaryUserId}`}
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                View customer →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
