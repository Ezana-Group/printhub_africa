/**
 * PATCH /api/admin/production-queue/[id] — update status (and optional assignedTo, machineId, notes)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const STATUSES = ["Queued", "In Progress", "Printing", "Quality Check", "Done"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  assignedTo: z.string().max(100).nullable().optional(),
  machineId: z.string().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
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

  const item = await prisma.productionQueue.update({
    where: { id },
    data: update,
  });
  return NextResponse.json({
    id: item.id,
    status: item.status,
    startedAt: item.startedAt?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
  });
}
