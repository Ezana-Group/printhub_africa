/**
 * GET /api/admin/production-queue — list all production queue items for Kanban
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/orders", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.productionQueue.findMany({
    orderBy: { id: "asc" },
    include: {
      orderItem: {
        include: {
          order: { select: { orderNumber: true } },
          product: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(
    items.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      orderItemId: i.orderItemId,
      orderNumber: i.orderItem?.order?.orderNumber,
      productName: i.orderItem?.product?.name,
      quantity: i.orderItem?.quantity,
      status: i.status,
      assignedTo: i.assignedTo,
      startedAt: i.startedAt?.toISOString() ?? null,
      completedAt: i.completedAt?.toISOString() ?? null,
      machineId: i.machineId,
      notes: i.notes,
    }))
  );
}
