/**
 * PATCH /api/admin/production-queue/[id] — update status (and optional assignedTo, machineId, notes).
 * Optional body.pin: when provided (e.g. from shared production floor device), verifies user's production PIN.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const STATUSES = ["Queued", "In Progress", "Printing", "Quality Check", "Done"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  assignedTo: z.string().max(100).nullable().optional(),
  machineId: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  pin: z.string().length(4).regex(/^\d{4}$/).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;
  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/orders", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.pin !== undefined) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { productionPinHash: true },
    });
    if (!user?.productionPinHash) {
      return NextResponse.json(
        { error: "Production PIN not set. Set a PIN in Admin → Settings → My Account." },
        { status: 403 }
      );
    }
    if (!(await bcrypt.compare(parsed.data.pin, user.productionPinHash))) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 403 });
    }
  }

  const update: { status?: string; assignedTo?: string | null; machineId?: string | null; notes?: string | null; startedAt?: Date; completedAt?: Date } = {};
  if (parsed.data.status !== undefined) {
    update.status = parsed.data.status;
    if (parsed.data.status === "In Progress" || parsed.data.status === "Printing") {
      update.startedAt = new Date();
    }
    if (parsed.data.status === "Done") {
      update.completedAt = new Date();
    }
  }
  if (parsed.data.assignedTo !== undefined) update.assignedTo = parsed.data.assignedTo;
  if (parsed.data.machineId !== undefined) update.machineId = parsed.data.machineId;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;

  // Fetch current item to see if status is changing to Done
  const oldItem = await prisma.productionQueue.findUnique({
    where: { id },
  });

  const item = await prisma.productionQueue.update({
    where: { id },
    data: update,
    include: { orderItem: { include: { order: true, product: { select: { name: true } } } } }
  });

  // LOGIC: If status changed to DONE, trigger notifications and update machine
  if (parsed.data.status === "Done" && oldItem?.status !== "Done") {
    const productName = item.orderItem.product?.name || "Premium Print Item";
    
    // 1. Create Order Tracking Event
    await prisma.orderTrackingEvent.create({
      data: {
        orderId: item.orderId,
        status: "PRODUCED",
        title: "Production Completed",
        description: `${productName} has been finished and passed quality check.`,
        isPublic: true,
      }
    });

    // 2. Increment machine hours (if machine was assigned and we have timing)
    if (item.machineId && item.startedAt && item.completedAt) {
      const diffHrs = (item.completedAt.getTime() - item.startedAt.getTime()) / (1000 * 60 * 60);
      if (diffHrs > 0) {
        await prisma.printerAsset.update({
          where: { id: item.machineId },
          data: { hoursUsedTotal: { increment: diffHrs } }
        }).catch(err => console.error("Failed to update machine hours:", err));
      }
    }

    void (async () => {
      try {
        const { sendAdminAlert } = await import("@/lib/email");
        await sendAdminAlert({
          event: "New Order",
          subject: `Production finished: ${productName} — Order #${item.orderItem.order.orderNumber}`,
          html: `<p>Production complete for <strong>${productName}</strong> × ${item.orderItem.quantity}.<br>Order: #${item.orderItem.order.orderNumber}<br><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${item.orderId}">View order</a></p>`,
        });
      } catch (err) {
        console.error("Admin alert (production finished) failed:", err);
      }
    })();
  }

  return NextResponse.json({
    id: item.id,
    status: item.status,
    startedAt: item.startedAt?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
  });
}
