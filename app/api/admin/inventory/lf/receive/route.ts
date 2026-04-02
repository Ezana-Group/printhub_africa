import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/**
 * Weighted average cost after receiving new stock:
 * newAvg = (currentOnHand * currentAvg + qtyReceived * unitPrice) / (currentOnHand + qtyReceived)
 */
function updateAverageCost(
  currentOnHand: number,
  currentAvg: number,
  qtyReceived: number,
  unitPrice: number
): number {
  const totalQty = currentOnHand + qtyReceived;
  if (totalQty <= 0) return unitPrice;
  return (currentOnHand * currentAvg + qtyReceived * unitPrice) / totalQty;
}

/** POST: Record receipt of LF stock and update averageCostKes */
export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const code =
      typeof body.code === "string" ? body.code : typeof body.itemCode === "string" ? body.itemCode : null;
    const quantityReceived = Math.max(0, Number(body.quantityReceived) ?? 0);
    const unitPriceKes = Math.max(0, Number(body.unitPriceKes) ?? 0);

    if (!code || quantityReceived <= 0) {
      return NextResponse.json(
        { error: "code and quantityReceived (positive) are required" },
        { status: 400 }
      );
    }

    const item = await prisma.lFStockItem.findUnique({ where: { code } });
    if (!item) {
      return NextResponse.json({ error: "LF stock item not found" }, { status: 404 });
    }

    const currentOnHand = item.quantityOnHand;
    const currentAvg = item.averageCostKes;
    const newAvg = updateAverageCost(
      currentOnHand,
      currentAvg,
      quantityReceived,
      unitPriceKes
    );

    await prisma.lFStockItem.update({
      where: { code },
      data: {
        quantityOnHand: currentOnHand + quantityReceived,
        lastPurchasePriceKes: unitPriceKes,
        averageCostKes: newAvg,
        costPerUnit: newAvg,
        totalUnitsEverPurchased: item.totalUnitsEverPurchased + quantityReceived,
        totalCostEverPurchased:
          item.totalCostEverPurchased + quantityReceived * unitPriceKes,
        lastReceivedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      code,
      quantityOnHand: currentOnHand + quantityReceived,
      averageCostKes: newAvg,
      lastPurchasePriceKes: unitPriceKes,
    });
  } catch (e) {
    console.error("LF receive error:", e);
    return NextResponse.json(
      { error: "Failed to record receipt" },
      { status: 500 }
    );
  }
}
