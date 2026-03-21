export const dynamic = 'force-dynamic'
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import Link from "next/link";

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {

  await requireAdminSection("/admin/orders");
  const { status } = await searchParams;

  const deliveries = await prisma.delivery.findMany({
    where: status ? { status: status as "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "FAILED" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          shippingAddress: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      assignedCourier: { select: { id: true, name: true, trackingUrl: true } },
      deliveryZone: { select: { name: true } },
    },
  });

  const statusCounts = await prisma.delivery.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const countByStatus = Object.fromEntries(statusCounts.map((r) => [r.status, r._count.id]));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Deliveries</h1>
        <div className="flex gap-2 flex-wrap">
          {["PENDING", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "FAILED"].map((s) => (
            <Link
              key={s}
              href={status === s ? "/admin/deliveries" : `/admin/deliveries?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                status === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {s} {countByStatus[s] != null ? `(${countByStatus[s]})` : "(0)"}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Order</th>
              <th className="text-left p-3 font-medium">Customer</th>
              <th className="text-left p-3 font-medium">Method</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Zone</th>
              <th className="text-left p-3 font-medium">Courier</th>
              <th className="text-left p-3 font-medium">Tracking</th>
              <th className="text-left p-3 font-medium">Est. delivery</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  No deliveries found.
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/admin/orders/${d.orderId}`} className="text-primary font-medium hover:underline">
                      {d.order?.orderNumber ?? d.orderId}
                    </Link>
                  </td>
                  <td className="p-3">
                    {d.order?.user?.name ?? d.order?.shippingAddress?.fullName ?? "—"}
                    {d.order?.user?.email && (
                      <span className="block text-muted-foreground text-xs">{d.order.user.email}</span>
                    )}
                  </td>
                  <td className="p-3">{d.method}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : d.status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : d.status === "DISPATCHED" || d.status === "IN_TRANSIT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3">{d.deliveryZone?.name ?? "—"}</td>
                  <td className="p-3">{d.assignedCourier?.name ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{d.trackingNumber ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">
                    {d.estimatedDelivery ? new Date(d.estimatedDelivery).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
