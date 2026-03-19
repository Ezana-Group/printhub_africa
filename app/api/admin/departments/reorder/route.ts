import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/** POST: Update sort order. Body: { order: string[] } department IDs. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const order = Array.isArray(body.order) ? body.order as string[] : null;
    if (!order || order.length === 0) {
      return NextResponse.json(
        { error: "order must be an array of department IDs" },
        { status: 400 }
      );
    }

    await Promise.all(
      order.map((id: string, index: number) =>
        prisma.department.update({
          where: { id },
          data: { sortOrder: index + 1 },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Departments reorder error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reorder" },
      { status: 500 }
    );
  }
}
