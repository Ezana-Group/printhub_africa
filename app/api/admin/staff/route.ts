import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken, getResetPasswordExpiry } from "@/lib/tokens";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const schema = z.object({
  email: z.string().email(),
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
  const session = await getServerSession(authOptions);
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
    const { email, password, name, role: newRole, department, departmentId, position, invite } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const useInviteFlow = invite === true || password == null || password === "";
    const rawPassword = useInviteFlow ? crypto.randomBytes(16).toString("hex") : password!;
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: newRole,
        emailVerified: useInviteFlow ? null : new Date(),
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
      await prisma.verificationToken.upsert({
        where: {
          identifier_token: { identifier: `reset:${email}`, token },
        },
        update: { token, expires: getResetPasswordExpiry() },
        create: {
          identifier: `reset:${email}`,
          token,
          expires: getResetPasswordExpiry(),
        },
      });
      await sendPasswordResetEmail(email, token);
    }

    await writeAudit({
      userId: actorId,
      action: useInviteFlow ? "STAFF_INVITED" : "STAFF_CREATED",
      entity: "STAFF",
      entityId: user.id,
      after: {
        email: user.email,
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
