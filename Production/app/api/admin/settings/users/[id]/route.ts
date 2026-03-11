import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(_req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot delete Super Admin" }, { status: 403 });
  }
  await prisma.user.delete({ where: { id } });
  await writeAudit({
    userId: auth.userId,
    action: "USER_DELETED",
    category: "STAFF",
    targetId: id,
    request: _req,
  });
  return NextResponse.json({ success: true });
}
