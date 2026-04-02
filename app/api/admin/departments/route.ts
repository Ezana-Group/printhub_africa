import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_STAFF_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/** GET: List departments (for dropdowns and manager). Admin/Staff only. */
export async function GET() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    where: {},
    include: { _count: { select: { staff: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ departments });
}

/** POST: Create department. Admin only. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() || null : null;
    const colour = typeof body.colour === "string" ? body.colour.trim() || null : null;

    if (!name) {
      return NextResponse.json({ error: "Department name is required" }, { status: 400 });
    }

    const existing = await prisma.department.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 }
      );
    }

    const maxOrder = await prisma.department.aggregate({ _max: { sortOrder: true } });
    const department = await prisma.department.create({
      data: {
        name,
        description,
        colour,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(
      { success: true, department: { ...department, _count: { staff: 0 } } },
      { status: 201 }
    );
  } catch (e) {
    console.error("Departments POST error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create department" },
      { status: 500 }
    );
  }
}
