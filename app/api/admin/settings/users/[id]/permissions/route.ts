import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  overrides: z.array(z.object({ permission: z.string(), granted: z.boolean() })),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  for (const o of body.data.overrides) {
    if (o.granted) {
      await prisma.userPermission.upsert({
        where: { userId_permission: { userId: id, permission: o.permission } },
        update: {},
        create: { userId: id, permission: o.permission },
      });
    } else {
      await prisma.userPermission.deleteMany({
        where: { userId: id, permission: o.permission },
      });
    }
  }
  await writeAudit({
    userId: auth.userId,
    action: "USER_PERMISSIONS_UPDATED",
    category: "STAFF",
    targetId: id,
    request: req,
  });
  return NextResponse.json({ success: true });
}
