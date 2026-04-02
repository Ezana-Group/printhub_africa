import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nWebhook } from "@/lib/n8n-verify";

/**
 * Endpoint for n8n's Daily Stock Check (Cron).
 */
export async function GET(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const consumables = await prisma.threeDConsumable.findMany({
      where: { currentStock: { lt: prisma.threeDConsumable.fields.minimumStock } },
      select: { id: true, name: true, currentStock: true, minimumStock: true, unit: true },
    });

    const stockItems = await prisma.lFStockItem.findMany({
      where: { currentStock: { lt: prisma.lFStockItem.fields.minimumStock } },
      select: { id: true, name: true, currentStock: true, minimumStock: true, unit: true },
    });

    const payload = [
      ...consumables.map(c => ({ itemId: c.id, itemName: c.name, itemType: 'ThreeDConsumable', currentStock: c.currentStock, minimumStock: c.minimumStock, unit: c.unit })),
      ...stockItems.map(s => ({ itemId: s.id, itemName: s.name, itemType: 'LFStockItem', currentStock: s.currentStock, minimumStock: s.minimumStock, unit: s.unit })),
    ];

    return NextResponse.json({ items: payload });
  } catch (err) {
    console.error("[stock-levels] Error fetching stock:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
