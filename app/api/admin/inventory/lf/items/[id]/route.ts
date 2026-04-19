import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/** PATCH: Update an LF stock item (name, threshold, etc.). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if (typeof body.lowStockThreshold === "number" && body.lowStockThreshold >= 0)
      update.lowStockThreshold = body.lowStockThreshold;
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const item = await prisma.lFStockItem.update({
      where: { id },
      data: update,
    });
    return NextResponse.json({
      id: item.id,
      code: item.code,
      name: item.name,
      lowStockThreshold: item.lowStockThreshold,
    });
  } catch (e) {
    console.error("LF item PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
