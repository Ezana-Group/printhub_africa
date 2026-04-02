import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin, invalidateStaffPermissionsCache } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { PERMISSION_KEYS } from "@/lib/admin-permissions";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const bodySchema = z.object({
  permissions: z.array(z.string()).refine(
    (arr) => arr.every((k) => (PERMISSION_KEYS as readonly string[]).includes(k)),
    { message: "Invalid permission keys" }
  ),
});

/** PATCH: Update staff permissions for user [id] (userId). Persists to DB. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    include: { staff: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.staff.upsert({
    where: { userId: user.id },
    update: { permissions: parsed.data.permissions },
    create: {
      userId: user.id,
      department: null,
      position: null,
      permissions: parsed.data.permissions,
    },
  });

  invalidateStaffPermissionsCache(user.id);

  await writeAudit({
    userId: actorId,
    action: "STAFF_PERMISSIONS_UPDATED",
    entity: "STAFF",
    entityId: user.id,
    after: {
      permissions: parsed.data.permissions,
      permissionsCount: parsed.data.permissions.length,
    },
    request: req,
  });

  return NextResponse.json({ success: true, permissions: parsed.data.permissions });
}

/** GET: Return current permissions for staff user (for re-fetch after save). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const staff = await prisma.staff.findUnique({
    where: { userId },
    select: { permissions: true },
  });

  const permissions = staff?.permissions ?? [];
  return NextResponse.json({ permissions });
}
