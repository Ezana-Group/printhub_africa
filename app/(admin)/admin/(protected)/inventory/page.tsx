export const dynamic = 'force-dynamic'
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InventoryTabs } from "@/components/admin/inventory-tabs";
import { requireAdminSection } from "@/lib/admin-route-guard";
import { serializeDecimal } from "@/lib/utils";

export default async function AdminInventoryPage() {
  try {

  await requireAdminSection("/admin/inventory");
  type LFStockRow = { id: string; code: string; name: string; category: string; unitType: string; rollWidthM: number | null; quantityOnHand: number; lowStockThreshold: number; costPerUnit: number; lastPurchasePriceKes: number | null; averageCostKes: number; lastReceivedAt: Date | null };
  type HardwareRow = { id: string; name: string; category: string; priceKes: number; location: string | null; linkedPrinterId: string | null; timeHours: number | null; hardwareType: string | null; printerSubType: string | null; model: string | null; maxPrintWidthM: number | null; printSpeedSqmPerHour: number | null; setupTimeHours: number | null; lifespanHours: number | null; annualMaintenanceKes: number | null; powerWatts: number | null; electricityRateKesKwh: number | null; maintenancePerYearKes: number | null; postProcessingTimeHours: number | null; isActive: boolean; sortOrder: number };
  const prismaClient = prisma as unknown as {
    lFStockItem: { findMany: (args: object) => Promise<LFStockRow[]> };
    machine: { findMany: (args: object) => Promise<Array<{ id: string; name: string; type: string; status: string; location: string | null; purchasePriceKes: number | null }>> };
    threeDConsumable: { findMany: (args: object) => Promise<Array<{ id: string; kind: string; name: string; specification: string | null; brand: string | null; quantity: number; lowStockThreshold: number; location: string | null; costPerKgKes: number | null; unitCostKes: number | null; notes: string | null }>> };
    inventoryHardwareItem: { findMany: (args: object) => Promise<HardwareRow[]> };
    printerAsset: { findMany: (args: object) => Promise<Array<{ id: string; name: string }>> };
  };
  const [shopProducts, lfStockItems, machines, consumables, hardwareItems, printerAssets] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        images: true,
        isActive: true,
        category: { select: { name: true } },
      },
    }),
    prismaClient.lFStockItem.findMany({
      orderBy: [{ category: "asc" }, { code: "asc" }],
    }),
    prisma.machine.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.threeDConsumable.findMany({
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      select: {
        id: true,
        kind: true,
        name: true,
        specification: true,
        colourHex: true,
        brand: true,
        quantity: true,
        weightPerSpoolKg: true,
        lowStockThreshold: true,
        location: true,
        costPerKgKes: true,
        unitCostKes: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prismaClient.inventoryHardwareItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prismaClient.printerAsset.findMany({
      where: { isActive: true },
      select: { 
        id: true, 
        name: true, 
        location: true, 
        printerType: true, 
        status: true, 
        purchasePriceKes: true,
        expectedLifespanHours: true,
        powerWatts: true,
        annualMaintenanceKes: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const lfItemsSerialized = lfStockItems.map((i: LFStockRow) => ({
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
  }));

  const machinesSerialized = (machines as Array<{ id: string; name: string; type: string; status: string; location: string | null; purchasePriceKes?: number | null }>).map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    status: m.status,
    location: m.location,
    purchasePriceKes: m.purchasePriceKes ?? null,
  }));

  const consumablesSerialized = (
    consumables as Array<{
      id: string;
      kind: string;
      name: string;
      specification: string | null;
      colourHex: string | null;
      brand: string | null;
      quantity: number;
      weightPerSpoolKg: number | null;
      lowStockThreshold: number;
      location: string | null;
      costPerKgKes: number | null;
      unitCostKes: number | null;
      notes: string | null;
    }>
  ).map((c) => {
    const row = {
      id: c.id,
      kind: c.kind,
      name: c.name,
      specification: c.specification,
      colourHex: c.colourHex ?? null,
      brand: c.brand ?? null,
      quantity: c.quantity,
      weightPerSpoolKg: c.weightPerSpoolKg ?? null,
      lowStockThreshold: c.lowStockThreshold,
      location: c.location,
      costPerKgKes: c.costPerKgKes ?? null,
      unitCostKes: c.unitCostKes ?? null,
      notes: c.notes ?? null,
    };
    if (c.kind === "FILAMENT") {
      const weightKg = c.weightPerSpoolKg ?? 1;
      (row as Record<string, unknown>).totalWeightKg = c.quantity * weightKg;
      (row as Record<string, unknown>).totalValueKes =
        (c.quantity * weightKg) * (c.costPerKgKes ?? 0);
      (row as Record<string, unknown>).stockStatus =
        c.quantity === 0
          ? "OUT_OF_STOCK"
          : c.quantity <= c.lowStockThreshold
            ? "LOW_STOCK"
            : "IN_STOCK";
    }
    return row;
  });

  const hardwareSerialized = hardwareItems.map((i: HardwareRow) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    priceKes: i.priceKes,
    location: i.location ?? null,
    linkedPrinterId: i.linkedPrinterId ?? null,
    timeHours: i.timeHours ?? null,
    hardwareType: i.hardwareType ?? null,
    printerSubType: i.printerSubType ?? null,
    model: i.model ?? null,
    maxPrintWidthM: i.maxPrintWidthM ?? null,
    printSpeedSqmPerHour: i.printSpeedSqmPerHour ?? null,
    setupTimeHours: i.setupTimeHours ?? null,
    lifespanHours: i.lifespanHours ?? null,
    annualMaintenanceKes: i.annualMaintenanceKes ?? null,
    powerWatts: i.powerWatts ?? null,
    electricityRateKesKwh: i.electricityRateKesKwh ?? null,
    maintenancePerYearKes: i.maintenancePerYearKes ?? null,
    postProcessingTimeHours: i.postProcessingTimeHours ?? null,
    isActive: i.isActive,
    sortOrder: i.sortOrder,
  }));

  const shopProductsSerialized = shopProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    stock: p.stock ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 0,
    images: p.images,
    isActive: p.isActive,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Shop products (finished units), print materials (raw), and hardware & assets. Use tabs to switch.
          </p>
          <p className="text-sm mt-2">
            <Link href="/admin/inventory/hardware/printers" className="text-primary hover:underline">
              Printers & Machines →
            </Link>
            <span className="text-muted-foreground ml-1">Full asset view (hours used, maintenance log, cost per hour)</span>
          </p>
        </div>
      </div>

      <InventoryTabs
        shopProducts={serializeDecimal(shopProductsSerialized)}
        lfStockItems={serializeDecimal(lfItemsSerialized)}
        machines={serializeDecimal(machinesSerialized)}
        consumables={serializeDecimal(consumablesSerialized)}
        hardwareItems={serializeDecimal(hardwareItems)}
        printerAssets={printerAssets.map((a: any) => ({ 
          id: a.id, 
          name: a.name,
          location: a.location,
          printerType: a.printerType,
          status: a.status,
          priceKes: a.purchasePriceKes,
          lifespanHours: a.expectedLifespanHours,
          powerWatts: a.powerWatts,
          maintenancePerYearKes: a.annualMaintenanceKes,
          isActive: a.isActive,
        }))}
      />
    </div>
  );

  } catch (error) {
    console.error("Data load failed in page.tsx:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <h2 className="font-bold text-lg mb-2">Service Temporarily Unavailable</h2>
          <p className="text-sm">We are experiencing issues connecting to our database. Please try refreshing the page in a few moments.</p>
        </div>
      </div>
    );
  }
}
