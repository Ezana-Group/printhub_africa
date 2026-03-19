import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MOVEMENT_TYPES = ["RECEIVED", "CONSUMED", "ADJUSTMENT", "RESERVED", "RELEASED"] as const;

const postSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.number().int(), // positive for RECEIVED, negative for CONSUMED/ADJUSTMENT
  costPerKgKes: z.number().min(0).optional().nullable(),
  supplier: z.string().max(200).optional().nullable(),
  reference: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/** GET: List stock movements for a consumable (newest first). */
export async function GET(
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
    const consumable = await prisma.threeDConsumable.findUnique({
      where: { id },
    });
    if (!consumable) {
      return NextResponse.json({ error: "Consumable not found" }, { status: 404 });
    }
    const movements = await prisma.threeDConsumableMovement.findMany({
      where: { consumableId: id },
      orderBy: { createdAt: "desc" },
      include: { performedBy: { select: { name: true, email: true } } },
    });
    const serialized = movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      costPerKgKes: m.costPerKgKes,
      supplier: m.supplier,
      reference: m.reference,
      notes: m.notes,
      performedById: m.performedById,
      performedBy: m.performedBy?.name ?? m.performedBy?.email ?? "—",
      createdAt: m.createdAt,
    }));
    return NextResponse.json(serialized);
  } catch (e) {
    console.error("3D consumable movements list error:", e);
    return NextResponse.json(
      { error: "Failed to load movements" },
      { status: 500 }
    );
  }
}

/** POST: Record a stock movement (e.g. RECEIVED +4) and update consumable quantity. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { type, quantity, costPerKgKes, supplier, reference, notes } = parsed.data;
  const performedById = (session.user as { id?: string })?.id ?? null;

  try {
    const consumable = await prisma.threeDConsumable.findUnique({
      where: { id },
    });
    if (!consumable) {
      return NextResponse.json({ error: "Consumable not found" }, { status: 404 });
    }

    const newQty = consumable.quantity + quantity;
    if (newQty < 0) {
      return NextResponse.json(
        { error: "Resulting quantity would be negative" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.threeDConsumableMovement.create({
        data: {
          consumableId: id,
          type,
          quantity,
          costPerKgKes: costPerKgKes ?? undefined,
          supplier: supplier ?? undefined,
          reference: reference ?? undefined,
          notes: notes ?? undefined,
          performedById: performedById ?? undefined,
        },
      }),
      prisma.threeDConsumable.update({
        where: { id },
        data: {
          quantity: newQty,
          ...(type === "RECEIVED" &&
            costPerKgKes != null &&
            consumable.kind === "FILAMENT" && { costPerKgKes: costPerKgKes }),
        },
      }),
    ]);

    const updated = await prisma.threeDConsumable.findUnique({
      where: { id },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("3D consumable movement create error:", e);
    return NextResponse.json(
      { error: "Failed to record movement" },
      { status: 500 }
    );
  }
}
