import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { Card, CardContent } from "@/components/ui/card";
import { RefundActionsClient } from "./refund-actions-client";

export default async function AdminRefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminSection("/admin/refunds");
  const { status } = await searchParams;
  const refunds = await prisma.refund.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          user: { select: { name: true, email: true } },
          payments: { orderBy: { createdAt: "desc" }, take: 1, select: { provider: true } },
        },
      },
    },
  });

  const statusCounts = await prisma.refund.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const countByStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r._count.id]));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Refunds</h1>
      <p className="text-muted-foreground text-sm mt-1">View and manage refunds.</p>
      <div className="flex gap-2 flex-wrap mt-4">
        <Link
          href="/admin/refunds"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!status ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
        >
          All {(countByStatus.PENDING ?? 0) + (countByStatus.COMPLETED ?? 0) + (countByStatus.REJECTED ?? 0) + (countByStatus.APPROVED ?? 0) + (countByStatus.FAILED ?? 0)}
        </Link>
        {["PENDING", "APPROVED", "COMPLETED", "REJECTED", "FAILED"].map((s) => (
          <Link
            key={s}
            href={status === s ? "/admin/refunds" : `/admin/refunds?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {s} {countByStatus[s] ?? 0}
          </Link>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Refund #</th>
                <th className="text-left p-3 font-medium">Order</th>
                <th className="text-left p-3 font-medium">Amount</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No refunds found.</td>
                </tr>
              ) : (
                refunds.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono">{r.refundNumber ?? r.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <Link href={`/admin/orders/${r.orderId}`} className="text-primary hover:underline">
                        {r.order?.orderNumber ?? r.orderId}
                      </Link>
                    </td>
                    <td className="p-3">KES {Number(r.amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${
                        r.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        r.status === "REJECTED" || r.status === "FAILED" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <RefundActionsClient
                        refundId={r.id}
                        status={r.status}
                        orderNumber={r.order?.orderNumber ?? r.orderId}
                        paymentProvider={r.order?.payments?.[0]?.provider ?? undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
