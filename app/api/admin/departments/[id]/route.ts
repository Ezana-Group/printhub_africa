import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/** PATCH: Update department. Admin only. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const name = body.name !== undefined ? (typeof body.name === "string" ? body.name.trim() : undefined) : undefined;
    const description = body.description !== undefined ? (typeof body.description === "string" ? body.description.trim() || null : null) : undefined;
    const colour = body.colour !== undefined ? (typeof body.colour === "string" ? body.colour.trim() || null : null) : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : undefined;
    const sortOrder = body.sortOrder !== undefined ? Number(body.sortOrder) : undefined;

    if (name !== undefined) {
      const existing = await prisma.department.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A department with this name already exists" },
          { status: 409 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (colour !== undefined) data.colour = colour;
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const department = await prisma.department.update({
      where: { id },
      data: data as Parameters<typeof prisma.department.update>[0]["data"],
    });

    const _count = await prisma.staff.count({ where: { departmentId: id } });
    return NextResponse.json({ success: true, department: { ...department, _count: { staff: _count } } });
  } catch (e) {
    console.error("Department PATCH error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 }
    );
  }
}

/** DELETE: Remove department if no staff assigned. Admin only. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { staff: true } } },
    });
    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
    if (dept._count.staff > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete department with ${dept._count.staff} staff member(s). Reassign them first or deactivate instead.`,
          code: "HAS_STAFF",
          staffCount: dept._count.staff,
        },
        { status: 400 }
      );
    }
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Department DELETE error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
