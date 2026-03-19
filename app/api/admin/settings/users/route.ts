import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { sendStaffInviteEmail } from "@/lib/email";
import { isStaffWorkEmail } from "@/lib/staff-email";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const users = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    include: { userPermissions: true, staff: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  personalEmail: z.string().email().optional().nullable(),
  role: z.enum(["STAFF", "ADMIN"]),
  department: z.string().optional(),
  position: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const body = inviteSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  const { name, email, personalEmail, role, department, position } = body.data;

  if (!isStaffWorkEmail(email)) {
    return NextResponse.json(
      { error: "Staff login email must end with @printhub.africa" },
      { status: 400 }
    );
  }

  const workEmail = email.trim().toLowerCase();
  const invitePersonalEmail =
    personalEmail && personalEmail.trim().length > 0 ? personalEmail.trim().toLowerCase() : null;

  if (invitePersonalEmail && invitePersonalEmail === workEmail) {
    return NextResponse.json(
      { error: "Personal email must be different from the work email" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: workEmail } });
  if (existing) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(token, 12);
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa";
  const newUser = await prisma.user.create({
    data: {
      name,
      email: workEmail,
      personalEmail: invitePersonalEmail,
      role,
      status: "INVITE_PENDING",
      inviteToken: tokenHash,
      inviteTokenExpiry: expiry,
      passwordHash: "[PENDING]",
    },
  });
  await prisma.staff.upsert({
    where: { userId: newUser.id },
    update: { department: department ?? null, position: position ?? null },
    create: {
      userId: newUser.id,
      department: department ?? null,
      position: position ?? null,
      permissions: [],
    },
  });

  const deliveryEmail = (invitePersonalEmail ?? workEmail).toLowerCase();
  const inviteUrl = `${baseUrl}/admin/accept-invite?token=${token}&id=${newUser.id}`;
  await sendStaffInviteEmail(deliveryEmail, token, workEmail, inviteUrl);

  await writeAudit({
    userId: auth.userId,
    action: "STAFF_INVITED",
    category: "STAFF",
    details: `Invited ${workEmail} as ${role}`,
    request: req,
  });
  return NextResponse.json({ success: true, userId: newUser.id });
}
