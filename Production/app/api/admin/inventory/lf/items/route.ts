import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

const CATEGORIES = ["SUBSTRATE_ROLL", "LAMINATION", "FINISHING", "INK"] as const;
const UNIT_TYPES = ["ROLL_LM", "SHEET", "UNIT", "BOTTLE_ML"] as const;

/** GET: List all LF stock items (for admin inventory — separate from shop products). */
export async function GET() {
  const auth = await requireAdminApi({ permission: "inventory_view" });
  if (auth instanceof NextResponse) return auth;
  try {
    const items = await prisma.lFStockItem.findMany({
      orderBy: [{ category: "asc" }, { code: "asc" }],
    });
    return NextResponse.json(
      items.map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        category: i.category,
        unitType: i.unitType,
        rollWidthM: i.rollWidthM,
        quantityOnHand: i.quantityOnHand,
        lowStockThreshold: i.lowStockThreshold,
        costPerUnit: i.costPerUnit,
        lastPurchasePriceKes: i.lastPurchasePriceKes,
        averageCostKes: i.averageCostKes,
        lastReceivedAt: i.lastReceivedAt?.toISOString() ?? null,
      }))
    );
  } catch (e) {
    console.error("LF items GET error:", e);
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}

/** POST: Create a new LF stock item (service material — not a shop product). */
export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "inventory_edit" });
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "_");
    const name = String(body.name ?? "").trim();
    const category = CATEGORIES.includes(body.category) ? body.category : "FINISHING";
    const unitType = UNIT_TYPES.includes(body.unitType) ? body.unitType : "UNIT";
    const rollWidthM = body.rollWidthM != null ? Number(body.rollWidthM) : null;
    const lowStockThreshold = Math.max(0, Number(body.lowStockThreshold) ?? 0);
    const quantityOnHand = Math.max(0, Number(body.quantityOnHand) ?? 0);
    const costPerUnit = Math.max(0, Number(body.costPerUnit) ?? 0);

    if (!code || !name) {
      return NextResponse.json(
        { error: "Code and name are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.lFStockItem.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "An item with this code already exists" },
        { status: 400 }
      );
    }

    const item = await prisma.lFStockItem.create({
      data: {
        code,
        name,
        category,
        unitType,
        rollWidthM: rollWidthM ?? undefined,
        quantityOnHand,
        lowStockThreshold,
        costPerUnit: costPerUnit || 0,
        averageCostKes: costPerUnit || 0,
      },
    });

    return NextResponse.json({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      unitType: item.unitType,
      rollWidthM: item.rollWidthM,
      quantityOnHand: item.quantityOnHand,
      lowStockThreshold: item.lowStockThreshold,
      averageCostKes: item.averageCostKes,
    });
  } catch (e) {
    console.error("LF items POST error:", e);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
