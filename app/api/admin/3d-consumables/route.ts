import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const KINDS = ["FILAMENT", "RESIN", "OTHER"] as const;

const createSchema = z.object({
  kind: z.enum(KINDS),
  name: z.string().min(1).max(200),
  specification: z.string().max(200).optional(),
  colourHex: z.string().max(20).optional(),
  brand: z.string().max(200).optional(),
  quantity: z.number().int().min(0),
  weightPerSpoolKg: z.number().min(0).optional().nullable(),
  lowStockThreshold: z.number().int().min(0).optional(),
  location: z.string().max(200).optional(),
  costPerKgKes: z.number().min(0).optional(),
  unitCostKes: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

function computeFilamentFields(c: {
  quantity: number;
  lowStockThreshold: number;
  costPerKgKes: number | null;
  weightPerSpoolKg: number | null;
}) {
  const weightKg = c.weightPerSpoolKg ?? 1;
  const totalWeightKg = c.quantity * weightKg;
  const costKg = c.costPerKgKes ?? 0;
  const totalValueKes = totalWeightKg * costKg;
  const status =
    c.quantity === 0
      ? "OUT_OF_STOCK"
      : c.quantity <= c.lowStockThreshold
        ? "LOW_STOCK"
        : "IN_STOCK";
  return { totalWeightKg, totalValueKes, stockStatus: status };
}

export async function GET() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const items = await prisma.threeDConsumable.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
    });
    const serialized = items.map((c) => {
      const row: Record<string, unknown> = {
        id: c.id,
        kind: c.kind,
        name: c.name,
        specification: c.specification,
        colourHex: c.colourHex,
        brand: c.brand,
        quantity: c.quantity,
        weightPerSpoolKg: c.weightPerSpoolKg,
        lowStockThreshold: c.lowStockThreshold,
        location: c.location,
        costPerKgKes: c.costPerKgKes,
        unitCostKes: c.unitCostKes,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
      if (c.kind === "FILAMENT") {
        const { totalWeightKg, totalValueKes, stockStatus } = computeFilamentFields({
          quantity: c.quantity,
          lowStockThreshold: c.lowStockThreshold,
          costPerKgKes: c.costPerKgKes,
          weightPerSpoolKg: c.weightPerSpoolKg,
        });
        row.totalWeightKg = totalWeightKg;
        row.totalValueKes = totalValueKes;
        row.stockStatus = stockStatus;
      }
      return row;
    });
    return NextResponse.json(serialized);
  } catch (e) {
    console.error("3D consumables list error:", e);
    return NextResponse.json(
      { error: "Failed to load consumables" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
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
    colourHex,
    brand,
    quantity,
    weightPerSpoolKg,
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
        colourHex: colourHex?.trim() || null,
        brand: brand?.trim() || null,
        quantity,
        weightPerSpoolKg: kind === "FILAMENT" ? (weightPerSpoolKg ?? 1) : null,
        lowStockThreshold,
        location: location || null,
        costPerKgKes: kind === "FILAMENT" ? (costPerKgKes ?? 0) : costPerKgKes ?? null,
        unitCostKes: kind !== "FILAMENT" ? (unitCostKes ?? null) : null,
        notes: notes?.trim() || null,
      },
    });
    const row = item as Record<string, unknown>;
    if (item.kind === "FILAMENT") {
      const { totalWeightKg, totalValueKes, stockStatus } = computeFilamentFields({
        quantity: item.quantity,
        lowStockThreshold: item.lowStockThreshold,
        costPerKgKes: item.costPerKgKes,
        weightPerSpoolKg: item.weightPerSpoolKg,
      });
      row.totalWeightKg = totalWeightKg;
      row.totalValueKes = totalValueKes;
      row.stockStatus = stockStatus;
    }
    return NextResponse.json(row);
  } catch (e) {
    console.error("3D consumable create error:", e);
    return NextResponse.json(
      { error: "Failed to create consumable" },
      { status: 500 }
    );
  }
}
