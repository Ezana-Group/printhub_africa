import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const KINDS = ["FILAMENT", "RESIN", "OTHER"] as const;

const createSchema = z.object({
  kind: z.enum(KINDS),
  name: z.string().min(1).max(200),
  specification: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  location: z.string().max(200).optional(),
  costPerKgKes: z.number().min(0).optional(),
  unitCostKes: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const items = await prisma.threeDConsumable.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error("3D consumables list error:", e);
    return NextResponse.json(
      { error: "Failed to load consumables" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const {
    kind,
    name,
    specification,
    brand,
    quantity,
    lowStockThreshold = 2,
    location,
    costPerKgKes,
    unitCostKes,
    notes,
  } = parsed.data;

  if (kind === "FILAMENT" && (costPerKgKes == null || costPerKgKes < 0)) {
    return NextResponse.json(
      { error: "Cost per kg (KES) is required for filament and must be ≥ 0" },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.threeDConsumable.create({
      data: {
        kind,
        name,
        specification: specification || null,
        brand: brand?.trim() || null,
        quantity,
        lowStockThreshold,
        location: location || null,
        costPerKgKes: kind === "FILAMENT" ? (costPerKgKes ?? 0) : costPerKgKes ?? null,
        unitCostKes: kind !== "FILAMENT" ? (unitCostKes ?? null) : null,
        notes: notes?.trim() || null,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("3D consumable create error:", e);
    return NextResponse.json(
      { error: "Failed to create consumable" },
      { status: 500 }
    );
  }
}
