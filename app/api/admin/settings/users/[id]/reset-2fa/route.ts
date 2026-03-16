import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

/** POST /api/admin/settings/users/[id]/reset-2fa
 * SUPER_ADMIN only. Clears 2FA for the target staff/admin user so they can set it up again.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, totpSecret: true, twoFaMethod: true },
  });

  if (!target || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!target.totpSecret && !target.twoFaMethod) {
    return NextResponse.json({ error: "2FA is not enabled for this user" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      totpSecret: null,
      twoFaMethod: null,
      otpCodeHash: null,
      otpExpiresAt: null,
    },
  });

  await writeAudit({
    userId: auth.userId,
    action: "USER_2FA_RESET",
    category: "STAFF",
    targetId: target.id,
    request: req,
  });

  return NextResponse.json({ success: true });
}

