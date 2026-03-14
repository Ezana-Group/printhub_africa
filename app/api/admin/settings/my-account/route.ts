import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const STAFF_OR_ADMIN = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const postSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  position: z.string().max(200).optional(),
  departmentId: z.string().nullable().optional(),
});

/** GET: Return current user profile for my-account form (name, email, phone, role, staff fields). */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      staff: {
        select: {
          position: true,
          departmentId: true,
          department: true,
          departmentObj: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role,
    createdAt: user.createdAt,
    position: user.staff?.position ?? null,
    departmentId: user.staff?.departmentId ?? null,
    department: user.staff?.department ?? null,
    departmentObj: user.staff?.departmentObj
      ? { id: user.staff.departmentObj.id, name: user.staff.departmentObj.name }
      : null,
  });
}

const ADMIN_OR_ABOVE = ["ADMIN", "SUPER_ADMIN"];

/** POST: Update current user profile. User: name, email, phone. Staff (admin only): position, departmentId. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const isAdminOrAbove = ADMIN_OR_ABOVE.includes(role);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  if (data.email !== undefined && data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.email != null && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone ?? null }),
      },
    });
    if (isAdminOrAbove && (data.position !== undefined || data.departmentId !== undefined)) {
      const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
      if (staff) {
        const deptRecord =
          data.departmentId != null
            ? await prisma.department.findUnique({ where: { id: data.departmentId } })
            : null;
        const departmentName = deptRecord?.name ?? (data.departmentId ? null : undefined);
        await prisma.staff.update({
          where: { userId: session.user.id },
          data: {
            ...(data.position !== undefined && {
              position: typeof data.position === "string" && data.position.trim() ? data.position.trim() : null,
            }),
            ...(data.departmentId !== undefined && { departmentId: data.departmentId ?? null }),
            ...(departmentName !== undefined && { department: departmentName }),
          },
        });
      } else {
        const deptRecord =
          data.departmentId != null
            ? await prisma.department.findUnique({ where: { id: data.departmentId } })
            : null;
        await prisma.staff.create({
          data: {
            userId: session.user.id,
            position: typeof data.position === "string" && data.position.trim() ? data.position.trim() : null,
            departmentId: data.departmentId ?? null,
            department: deptRecord?.name ?? null,
          },
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    console.error("My account profile update error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
