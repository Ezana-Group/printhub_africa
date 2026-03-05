import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const patchProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  position: z.string().max(100).nullable().optional(),
});

/** PATCH: Update staff profile (name, email, phone, department, position). ADMIN/SUPER_ADMIN only for other users. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
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
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.email != null && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
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
    await prisma.staff.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        department: data.department ?? null,
        position: data.position ?? null,
        permissions: [],
      },
      update: {
        ...(data.department !== undefined && { department: data.department }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Staff profile PATCH error (staff upsert):", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

/** DELETE: Remove staff/admin user. SUPER_ADMIN only. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
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
