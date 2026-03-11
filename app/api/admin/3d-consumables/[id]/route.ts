import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  specification: z.string().max(200).optional().nullable(),
  colourHex: z.string().max(20).optional().nullable(),
  brand: z.string().max(200).optional().nullable(),
  quantity: z.number().int().min(0).optional(),
  weightPerSpoolKg: z.number().min(0).optional().nullable(),
  lowStockThreshold: z.number().int().min(0).optional(),
  location: z.string().max(200).optional().nullable(),
  costPerKgKes: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/** PATCH: Update a 3D consumable (filament or other). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data as Record<string, unknown>;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const item = await prisma.threeDConsumable.update({
      where: { id },
      data,
    });
    const row = { ...item } as Record<string, unknown>;
    if (item.kind === "FILAMENT") {
      const weightKg = item.weightPerSpoolKg ?? 1;
      row.totalWeightKg = item.quantity * weightKg;
      row.totalValueKes = row.totalWeightKg as number * (item.costPerKgKes ?? 0);
      row.stockStatus =
        item.quantity === 0
          ? "OUT_OF_STOCK"
          : item.quantity <= item.lowStockThreshold
            ? "LOW_STOCK"
            : "IN_STOCK";
    }
    return NextResponse.json(row);
  } catch (e) {
    console.error("3D consumable PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}

/** DELETE: Remove a 3D consumable. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.threeDConsumable.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("3D consumable DELETE error:", e);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
