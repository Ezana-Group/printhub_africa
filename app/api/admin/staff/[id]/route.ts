import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";
import { isStaffWorkEmail } from "@/lib/staff-email";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const patchProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  personalEmail: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  departmentId: z.string().nullable().optional(),
  position: z.string().max(100).nullable().optional(),
  status: z.string().optional(),
});

/** PATCH: Update staff profile (name, email, phone, department, position). ADMIN/SUPER_ADMIN only for other users. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
    include: { staff: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const nextWorkEmail =
    data.email != null ? data.email.trim().toLowerCase() : user.email.trim().toLowerCase();
  if (data.email != null && !isStaffWorkEmail(data.email)) {
    return NextResponse.json(
      { error: "Staff login email must end with @printhub.africa" },
      { status: 400 }
    );
  }

  let nextPersonal: string | null | undefined = undefined;
  if (data.personalEmail !== undefined) {
    nextPersonal =
      data.personalEmail && data.personalEmail.trim().length > 0
        ? data.personalEmail.trim().toLowerCase()
        : null;
    if (nextPersonal && nextPersonal === nextWorkEmail) {
      return NextResponse.json(
        {
          error:
            "Personal email must differ from the work email, or leave it blank to use the work address for notifications.",
        },
        { status: 400 }
      );
    }
  }

  if (data.email != null && data.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${user.email}` },
    });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.email != null && { email: data.email.trim().toLowerCase() }),
        ...(data.personalEmail !== undefined && { personalEmail: nextPersonal }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    console.error("Staff profile PATCH error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  try {
    const deptRecord =
      data.departmentId !== undefined && data.departmentId != null
        ? await prisma.department.findUnique({ where: { id: data.departmentId } })
        : null;
    const departmentName = deptRecord?.name ?? (data.department !== undefined ? data.department : undefined);

    await prisma.staff.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        department: departmentName ?? null,
        departmentId: data.departmentId ?? null,
        position: data.position ?? null,
        permissions: [],
      },
      update: {
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(departmentName !== undefined && { department: departmentName }),
        ...(data.department !== undefined && data.departmentId == null && { department: data.department }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });

    await writeAudit({
      userId: actorId,
      action: "STAFF_PROFILE_UPDATED",
      entity: "STAFF",
      entityId: user.id,
      after: {
        name: data.name,
        email: data.email,
        status: data.status,
        ...(data.personalEmail !== undefined && { personalEmail: nextPersonal }),
        phone: data.phone,
        department: data.department,
        departmentId: data.departmentId,
        position: data.position,
      },
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Staff profile PATCH error (staff upsert):", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

/** DELETE: Remove staff/admin user. SUPER_ADMIN only. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.id === session?.user?.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  try {
    await writeAudit({
      userId: actorId,
      action: "STAFF_DELETED",
      entity: "STAFF",
      entityId: user.id,
      after: {
        deletedEmail: user.email,
        deletedRole: user.role,
      },
      request: req,
    });
    await prisma.staff.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete staff error:", e);
    return NextResponse.json(
      { error: "Could not delete user. They may have related data." },
      { status: 500 }
    );
  }
}
