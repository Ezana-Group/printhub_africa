import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { sendPasswordResetEmail, sendStaffInviteEmail } from "@/lib/email";
import { generateToken, getResetPasswordExpiry, getStaffInviteExpiry } from "@/lib/tokens";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/** POST: Send password reset email to this staff member. ADMIN/SUPER_ADMIN only. */
export async function POST(
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
  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "This account uses social login and has no password to reset." },
      { status: 400 }
    );
  }

  const token = generateToken();
  const identifier = `reset:${user.email}`;
  const isPendingInvite = user.status === "INVITE_PENDING";
  const expiresAt = isPendingInvite ? getStaffInviteExpiry() : getResetPasswordExpiry();
  const deliveryEmail = (user.personalEmail?.trim() || user.email).toLowerCase();

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires: expiresAt },
  });

  if (isPendingInvite) {
    await sendStaffInviteEmail(deliveryEmail, token, user.email);
  } else {
    await sendPasswordResetEmail(deliveryEmail, token);
  }

  await writeAudit({
    userId: actorId,
    action: "STAFF_PASSWORD_RESET_SENT",
    entity: "STAFF",
    entityId: user.id,
    after: {
      email: user.email,
      deliveryEmail,
      invitePending: isPendingInvite,
      role: user.role,
    },
    request: req,
  });

  return NextResponse.json({
    message: isPendingInvite ? "Invite email sent." : "Password reset email sent.",
  });
}
