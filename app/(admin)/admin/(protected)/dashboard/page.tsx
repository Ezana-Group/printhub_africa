export const dynamic = 'force-dynamic'
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { RevenueChart, StatusPieChart } from "@/components/admin/dashboard-charts";
import { canAccessRoute } from "@/lib/admin-permissions";
import { ShoppingCart, Printer, FileText, ShieldCheck } from "lucide-react";
import { N8nHealthCard } from "@/components/admin/n8n-health-card";

const PRINT_JOB_TYPES = ["LARGE_FORMAT", "THREE_D_PRINT", "CUSTOM_PRINT"] as const;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  const permissions = (session.user as { permissions?: string[] }).permissions;
  if (!canAccessRoute("/admin/dashboard", role ?? "", permissions)) {
    redirect("/admin/access-denied");
  }
  
  const name = session.user.name ?? "Administrator";
  const lastLoginAt = (session.user as any).lastLoginAt;
  const lastLoginIp = (session.user as any).lastLoginIp;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const [
      orders,
      paymentsWithType,
      pendingOrders,
      uploadsAwaiting,
      productsWithThreshold,
      recentOrders,
      todayOrders,
      todayPayments,
      productionQueueCounts,
      printerStatus,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
        include: { payments: true },
      }).catch(() => []),
      prisma.payment.findMany({
        where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
        include: { order: { select: { type: true } } },
      }).catch(() => []),
      prisma.order.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.uploadedFile.count({ where: { status: "UPLOADED" } }).catch(() => 0),
      prisma.product.findMany({
        select: { id: true, name: true, stock: true, lowStockThreshold: true },
        take: 200,
      }).catch(() => []),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }).catch(() => []),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { id: true, type: true },
      }).catch(() => []),
      prisma.payment.findMany({
        where: { status: "COMPLETED", createdAt: { gte: startOfToday } },
      }).catch(() => []),
      prisma.productionQueue.groupBy({
        by: ["status"],
        _count: { id: true },
      }).catch(() => []),
      prisma.printerAsset.findMany({
        where: { isActive: true },
        select: { name: true },
        take: 5,
      }).catch(() => []),
    ]);

  // Low stock: stock ≤ lowStockThreshold when set, else stock ≤ 5 or out of stock
  const shopLowStockList = productsWithThreshold.filter((p) => {
    const threshold = p.lowStockThreshold ?? 0;
    const currentStock = p.stock ?? 0;
    return threshold > 0 ? currentStock <= threshold : currentStock <= 5;
  });

  let lfLow: { name: string; quantityOnHand: number }[] = [];
  let threeDLow: { name: string; quantity: number }[] = [];
  const prismaWithOptional = prisma as unknown as {
    lFStockItem?: { findMany: (args: object) => Promise<{ name: string; quantityOnHand: number; lowStockThreshold: number }[]> };
    threeDConsumable?: { findMany: (args: object) => Promise<{ name: string; quantity: number; lowStockThreshold: number }[]> };
  };
  try {
    const [lf, threeD] = await Promise.all([
      prismaWithOptional.lFStockItem
        ? prismaWithOptional.lFStockItem.findMany({ where: { lowStockThreshold: { gt: 0 } }, take: 5 })
        : [],
      prismaWithOptional.threeDConsumable
        ? prismaWithOptional.threeDConsumable.findMany({ where: { lowStockThreshold: { gt: 0 } }, take: 5 })
        : [],
    ]);
    lfLow = (lf ?? []).filter((i) => i.quantityOnHand < i.lowStockThreshold);
    threeDLow = (threeD ?? []).filter((i) => i.quantity < i.lowStockThreshold);
  } catch (err) {
    console.error("Dashboard low-stock fetch failed:", err);
  }

  const revenue = paymentsWithType.reduce((s, p) => s + Number(p.amount), 0);
  const revenueByLine = paymentsWithType.reduce(
    (acc, p) => {
      const type = p.order?.type ?? "SHOP";
      const amt = Number(p.amount);
      if (type === "SHOP") acc.shop += amt;
      else if (type === "QUOTE") acc.corporate += amt;
      else acc.print += amt;
      return acc;
    },
    { shop: 0, print: 0, corporate: 0 }
  );

  const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount), 0);
  const todayShop = todayOrders.filter((o) => o.type === "SHOP").length;
  const todayPrint = todayOrders.filter((o) => PRINT_JOB_TYPES.includes(o.type as (typeof PRINT_JOB_TYPES)[number])).length;
  const todayQuotes = todayOrders.filter((o) => o.type === "QUOTE").length;

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

  const queueByStatus = (productionQueueCounts as { status: string; _count: { id: number } }[]).reduce(
    (acc, q) => {
      acc[q.status] = q._count.id;
      return acc;
    },
    {} as Record<string, number>
  );
  const inQueue = queueByStatus["Queued"] ?? 0;
  const inProgress = (queueByStatus["In Progress"] ?? 0) + (queueByStatus["Printing"] ?? 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            System Status: Operational
          </p>
        </div>
        
        {lastLoginAt && (
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3">
            <div className="bg-white dark:bg-zinc-800 h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-4 w-4 text-[#FF4D00]" />
            </div>
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Security Insight</p>
              <p className="text-zinc-500">Last login from <span className="font-medium text-zinc-700 dark:text-zinc-300">{lastLoginIp || "unknown"}</span></p>
            </div>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Today&apos;s snapshot</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span>New shop orders: <strong>{todayShop}</strong></span>
          <span>Print jobs active: <strong>{todayPrint}</strong></span>
          <span>Quotes pending: <strong>{todayQuotes}</strong></span>
          <span>Today&apos;s revenue: <strong>{formatPrice(todayRevenue)}</strong></span>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Revenue this month</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <p className="text-sm text-muted-foreground">Shop</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPrice(revenueByLine.shop)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Printer className="h-4 w-4" />
              <p className="text-sm text-muted-foreground">Print services</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPrice(revenueByLine.print)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <FileText className="h-4 w-4" />
              <p className="text-sm text-muted-foreground">Corporate</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPrice(revenueByLine.corporate)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total revenue (month)</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total orders</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Pending orders</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Files awaiting review</p>
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
            <h2 className="font-semibold">Production (print services)</h2>
            <Link href="/admin/orders?tab=print-jobs" className="text-sm text-primary hover:underline">
              Print jobs
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">Jobs in queue: <strong>{inQueue}</strong></div>
            <div className="text-sm">In production: <strong>{inProgress}</strong></div>
            {(printerStatus as { name: string }[]).length > 0 && (
              <div className="text-sm text-muted-foreground mt-2">
                Printers: {(printerStatus as { name: string }[]).map((p) => p.name).join(" | ")} <Badge variant="secondary">Active</Badge>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Inventory alerts</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {shopLowStockList.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Shop:</span> {shopLowStockList.length} product(s) low on stock
                {" "}
                <Link href="/admin/inventory" className="text-primary hover:underline">View</Link>
              </div>
            )}
            {lfLow.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Print (LF):</span> {lfLow.map((i) => `${i.name} (${i.quantityOnHand})`).join(", ")}
              </div>
            )}
            {threeDLow.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Print (3D):</span> {threeDLow.map((i) => `${i.name} (${i.quantity})`).join(", ")}
              </div>
            )}
            {shopLowStockList.length === 0 && lfLow.length === 0 && threeDLow.length === 0 && (
              <div className="text-muted-foreground text-sm">No low stock alerts</div>
            )}
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
            <h2 className="font-semibold">Low stock (shop products)</h2>
          </CardHeader>
          <CardContent>
            {shopLowStockList.length > 0 ? (
              <ul className="space-y-2">
                {shopLowStockList.map((i) => (
                  <li key={i.id} className="text-sm">
                    {i.name} — {i.stock} left
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground text-sm">No low stock items</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
  } catch (err) {
    console.error("Admin dashboard data load failed:", err);
    const message = err instanceof Error ? err.message : "Database or connection error";
    return (
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold mb-4">Dashboard</h1>
        <Card>
          <CardHeader>
            <div className="text-destructive font-medium">Unable to load dashboard</div>
            <div className="text-sm text-muted-foreground">
              {message}. Check that migrations have been run and DATABASE_URL is correct. Try again or contact support.
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard" className="text-primary hover:underline">
              Retry
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
}
