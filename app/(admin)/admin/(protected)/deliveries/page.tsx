export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { DeliveriesListClient } from "./DeliveriesListClient";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default async function AdminDeliveriesPage() {
  try {
    await requireAdminSection("/admin/orders");

    // Parallel fetch for optimal performance
    const [deliveries, couriers, statusCounts] = await Promise.all([
      prisma.delivery.findMany({
        orderBy: { createdAt: "desc" },
        take: 500, // Show a generous amount of recent deliveries
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
          assignedCourier: { select: { id: true, name: true } },
          deliveryZone: { select: { name: true } },
        },
      }),
      prisma.courier.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      }),
      prisma.delivery.groupBy({
        by: ["status"],
        _count: { id: true },
      })
    ]);

    const countByStatus = Object.fromEntries(
      statusCounts.map((r) => [r.status, r._count.id])
    );

    // Cast statuses to match our expectations
    const typedDeliveries = deliveries as any;

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logistics Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Manage Kenyan shipments and trigger automated customer notifications.
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">PENDING DISPATCH</p>
                <p className="text-2xl font-bold">{countByStatus["PENDING"] || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">IN TRANSIT</p>
                <p className="text-2xl font-bold">{(countByStatus["DISPATCHED"] || 0) + (countByStatus["IN_TRANSIT"] || 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">DELIVERED (TOTAL)</p>
                <p className="text-2xl font-bold">{countByStatus["DELIVERED"] || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">FAILED DELIVERIES</p>
                <p className="text-2xl font-bold">{countByStatus["FAILED"] || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DeliveriesListClient 
          deliveries={typedDeliveries} 
          couriers={couriers} 
          counts={countByStatus}
        />
      </div>
    );
  } catch (error) {
    console.error("Data load failed in deliveries page:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Logistics Service Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to the delivery database.</p>
        </div>
      </div>
    );
  }
}
