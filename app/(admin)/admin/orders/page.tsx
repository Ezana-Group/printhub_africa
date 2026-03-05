import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { requireAdminSection } from "@/lib/admin-route-guard";

export default async function AdminOrdersPage() {
  await requireAdminSection("/admin/orders");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      payments: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Order #</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Total</th>
                  <th className="text-left p-4 font-medium">Payment</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-mono">{o.orderNumber}</td>
                    <td className="p-4">
                      {o.user?.name ?? o.user?.email ?? "Guest"}
                    </td>
                    <td className="p-4">{o.type}</td>
                    <td className="p-4">{formatPrice(Number(o.total))}</td>
                    <td className="p-4">
                      <Badge variant={o.payments[0]?.status === "COMPLETED" ? "default" : "secondary"}>
                        {o.payments[0]?.status ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={o.status === "PENDING" ? "destructive" : "outline"}>
                        {o.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {o.createdAt.toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
