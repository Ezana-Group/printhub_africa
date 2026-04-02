/**
 * GET /api/admin/refunds — list all refunds (with optional status filter)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/finance", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const refunds = await prisma.refund.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  return NextResponse.json(
    refunds.map((r) => ({
      id: r.id,
      refundNumber: r.refundNumber,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      processedBy: r.processedBy,
      processedAt: r.processedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      order: r.order,
    }))
  );
}
