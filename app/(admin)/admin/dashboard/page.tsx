import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { RevenueChart, StatusPieChart } from "@/components/admin/dashboard-charts";
import { canAccessRoute } from "@/lib/admin-permissions";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  const permissions = (session.user as { permissions?: string[] }).permissions;
  if (!canAccessRoute("/admin/dashboard", role ?? "", permissions)) {
    redirect("/admin/access-denied");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [orders, payments, pendingOrders, uploadsAwaiting, lowStock] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      include: { payments: true },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.uploadedFile.count({ where: { status: "UPLOADED" } }),
    prisma.inventory.findMany({
      where: { quantity: { lt: 5 } },
      take: 5,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const revenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const revenueByDay = orders.reduce((acc, o) => {
    const day = o.createdAt.toISOString().slice(0, 10);
    if (!acc[day]) acc[day] = 0;
    const paid = o.payments.find((p) => p.status === "COMPLETED");
    if (paid) acc[day] += Number(paid.amount);
    return acc;
  }, {} as Record<string, number>);
  const chartData = Object.entries(revenueByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, revenue: value }));

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Revenue (this month)</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Pending Orders</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Files Awaiting Review</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uploadsAwaiting}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Revenue (this month)</h2>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Orders by status</h2>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={pieData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/50 rounded px-2 -mx-2"
                >
                  <span className="font-mono text-sm">{o.orderNumber}</span>
                  <Badge variant={o.status === "PENDING" ? "destructive" : "secondary"}>
                    {o.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatPrice(Number(o.total))}</span>
                </Link>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-muted-foreground text-sm">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Low stock alerts</h2>
          </CardHeader>
          <CardContent>
            {lowStock.length > 0 ? (
              <ul className="space-y-2">
                {lowStock.map((i) => (
                  <li key={i.id} className="text-sm">
                    {i.product?.name ?? i.productId} — {i.quantity} left
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No low stock items</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
