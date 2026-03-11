import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  await writeAudit({
    userId: auth.userId,
    action: "USER_REACTIVATED",
    category: "STAFF",
    targetId: id,
    request: req,
  });
  return NextResponse.json({ success: true });
}
