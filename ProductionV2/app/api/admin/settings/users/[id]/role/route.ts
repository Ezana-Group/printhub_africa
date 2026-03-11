import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = z.object({ role: z.enum(["STAFF", "ADMIN"]) }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "SUPER_ADMIN" && auth.userId !== id) {
    return NextResponse.json({ error: "Cannot change Super Admin role" }, { status: 403 });
  }
  await prisma.user.update({
    where: { id },
    data: { role: body.data.role },
  });
  await writeAudit({
    userId: auth.userId,
    action: "USER_ROLE_UPDATED",
    category: "STAFF",
    targetId: id,
    details: `Role set to ${body.data.role}`,
    request: req,
  });
  return NextResponse.json({ success: true });
}
