import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

const bodySchema = z.object({ targetUserId: z.string(), password: z.string(), totpCode: z.string().optional() });

function verifyTotp(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  return true; // TODO: use otplib
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  if (auth.userId === undefined) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { passwordHash: true, totpSecret: true },
  });
  if (!user?.passwordHash || !(await bcrypt.compare(body.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
  }
  if (user.totpSecret && !verifyTotp(user.totpSecret, body.data.totpCode ?? "")) {
    return NextResponse.json({ error: "Invalid 2FA code" }, { status: 400 });
  }
  const target = await prisma.user.findUnique({
    where: { id: body.data.targetUserId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!target || target.role === "CUSTOMER") {
    return NextResponse.json({ error: "Target user not found or not staff" }, { status: 404 });
  }
  const current = await prisma.user.findUnique({ where: { id: auth.userId }, select: { email: true, name: true } });
  await prisma.$transaction([
    prisma.user.update({ where: { id: auth.userId }, data: { role: "ADMIN" } }),
    prisma.user.update({ where: { id: target.id }, data: { role: "SUPER_ADMIN" } }),
  ]);
  if (current?.email) {
    await sendEmail({
      to: current.email,
      subject: "PrintHub — Ownership transferred",
      html: `<p>You have transferred Super Admin ownership to ${target.name ?? target.email}.</p>`,
    });
  }
  if (target.email) {
    await sendEmail({
      to: target.email,
      subject: "PrintHub — You are now Super Admin",
      html: `<p>You have been assigned as Super Admin for PrintHub. You now have full access to all settings and danger zone actions.</p>`,
    });
  }
  await writeAudit({
    userId: auth.userId,
    action: "OWNERSHIP_TRANSFERRED",
    category: "DANGER",
    details: `Transferred to ${target.email}`,
    request: req,
  });
  return NextResponse.json({ success: true });
}
