import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { sendStaffInviteEmail } from "@/lib/email";
import { generateToken, getStaffInviteExpiry } from "@/lib/tokens";
import { isStaffWorkEmail } from "@/lib/staff-email";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const schema = z.object({
  email: z.string().email(),
  personalEmail: z.string().email().optional().nullable(),
  password: z.string().min(8, "At least 8 characters").optional(),
  name: z.string().min(1, "Name required"),
  role: z.enum(["STAFF", "ADMIN", "SUPER_ADMIN"]),
  department: z.string().optional(),
  departmentId: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  invite: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      const first = err.fieldErrors.password?.[0] ?? err.fieldErrors.email?.[0] ?? err.fieldErrors.name?.[0];
      return NextResponse.json(
        { error: typeof first === "string" ? first : "Invalid input" },
        { status: 400 }
      );
    }
    const {
      email,
      personalEmail: personalEmailRaw,
      password,
      name,
      role: newRole,
      department,
      departmentId,
      position,
      phone,
      invite,
    } = parsed.data;

    if (newRole === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only a Super Admin can create another Super Admin" },
        { status: 403 }
      );
    }

    if (!isStaffWorkEmail(email)) {
      return NextResponse.json(
        { error: "Staff login email must end with @printhub.africa" },
        { status: 400 }
      );
    }

    const workEmail = email.trim().toLowerCase();

    const personalEmail =
      personalEmailRaw && personalEmailRaw.trim().length > 0
        ? personalEmailRaw.trim().toLowerCase()
        : null;
    if (personalEmail && personalEmail === workEmail) {
      return NextResponse.json(
        { error: "Personal email must be different from the work email, or leave it blank to send the invite to the work address." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: workEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const useInviteFlow = invite === true || password == null || password === "";
    const rawPassword = useInviteFlow ? crypto.randomBytes(16).toString("hex") : password!;
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const inviteDeliveryEmail = personalEmail ?? workEmail;

    const user = await prisma.user.create({
      data: {
        email: workEmail,
        ...(personalEmail != null && { personalEmail }),
        ...(phone != null && phone.trim() !== "" && { phone: phone.trim() }),
        name,
        passwordHash,
        role: newRole,
        emailVerified: useInviteFlow ? null : new Date(),
        status: useInviteFlow ? "INVITE_PENDING" : "ACTIVE",
      },
    });

    const deptRecord = departmentId
      ? await prisma.department.findUnique({ where: { id: departmentId } })
      : null;
    const departmentName = deptRecord?.name ?? department ?? null;

    if (departmentName != null || position != null || departmentId != null) {
      await prisma.staff.upsert({
        where: { userId: user.id },
        update: {
          department: departmentName,
          departmentId: departmentId ?? null,
          position: position ?? null,
        },
        create: {
          userId: user.id,
          department: departmentName,
          departmentId: departmentId ?? null,
          position: position ?? null,
          permissions: [],
        },
      });
    }

    if (useInviteFlow) {
      const token = generateToken();
      const identifier = `reset:${user.email}`;
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      await prisma.verificationToken.create({
        data: {
          identifier,
          token,
          expires: getStaffInviteExpiry(),
        },
      });
      await sendStaffInviteEmail(inviteDeliveryEmail, token, workEmail);
    }

    await writeAudit({
      userId: actorId,
      action: useInviteFlow ? "STAFF_INVITED" : "STAFF_CREATED",
      entity: "STAFF",
      entityId: user.id,
      after: {
        email: user.email,
        personalEmail: user.personalEmail,
        inviteTo: inviteDeliveryEmail,
        role: user.role,
        invite: useInviteFlow,
        department: departmentName,
        departmentId: departmentId ?? null,
        position: position ?? null,
      },
      request: req,
    });

    return NextResponse.json({
      message: useInviteFlow ? "Invite sent. They can set their password via the email link." : "Staff added successfully.",
      userId: user.id,
    });
  } catch (e) {
    console.error("Add staff error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
