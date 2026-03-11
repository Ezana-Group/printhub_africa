import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintersList } from "@/components/admin/printers-list";

export default async function HardwarePrintersPage() {
  const [business, assets, inventoryPrinters] = await Promise.all([
    prisma.lFBusinessSettings.findFirst().catch(() => null),
    prisma.printerAsset.findMany({
      where: { isActive: true },
      orderBy: [{ printerType: "asc" }, { assetTag: "asc" }],
    }),
    prisma.inventoryHardwareItem.findMany({
      where: { isActive: true, category: "HARDWARE", hardwareType: { in: ["LARGE_FORMAT_PRINTER", "THREE_D_PRINTER"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  const workingHoursPerMonth = (business?.workingDaysPerMonth ?? 26) * (business?.workingHoursPerDay ?? 8);

  const assetList = assets.map((a) => {
    const dep = a.expectedLifespanHours > 0 ? a.purchasePriceKes / a.expectedLifespanHours : 0;
    const maint = workingHoursPerMonth * 12 > 0 ? a.annualMaintenanceKes / (workingHoursPerMonth * 12) : 0;
    const elec = (a.powerWatts / 1000) * a.electricityRateKesKwh;
    const remaining = Math.max(0, a.expectedLifespanHours - a.hoursUsedTotal);
    return {
      id: a.id,
      name: a.name,
      assetTag: a.assetTag,
      printerType: a.printerType,
      status: a.status,
      location: a.location,
      purchasePriceKes: a.purchasePriceKes,
      hoursUsedTotal: a.hoursUsedTotal,
      expectedLifespanHours: a.expectedLifespanHours,
      remainingLifespanHours: remaining,
      depreciationPerHourKes: dep,
      maintenancePerHourKes: maint,
      electricityPerHourKes: elec,
      totalMachinePerHourKes: dep + maint + elec,
      nextScheduledMaintDate: a.nextScheduledMaintDate?.toISOString() ?? null,
      source: "PrinterAsset" as const,
    };
  });

  const inventoryList = inventoryPrinters.map((p) => ({
    id: p.id,
    name: p.name,
    assetTag: null as string | null,
    printerType: p.hardwareType === "LARGE_FORMAT_PRINTER" ? "LARGE_FORMAT" : "FDM",
    status: "ACTIVE" as const,
    location: p.location,
    purchasePriceKes: p.priceKes,
    hoursUsedTotal: null as number | null,
    expectedLifespanHours: p.lifespanHours,
    remainingLifespanHours: p.lifespanHours,
    depreciationPerHourKes: null as number | null,
    maintenancePerHourKes: null as number | null,
    electricityPerHourKes: null as number | null,
    totalMachinePerHourKes: null as number | null,
    nextScheduledMaintDate: null as string | null,
    source: "InventoryHardwareItem" as const,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/inventory" className="text-sm text-primary hover:underline">
            ← Back to Inventory
          </Link>
          <h1 className="font-display text-2xl font-bold mt-1">Printers & Machines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registered printer assets and hardware. Costs here feed the quote calculator.
          </p>
        </div>
        <Link
          href="/admin/inventory/hardware/printers/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Register new printer
        </Link>
      </div>

      <PrintersList assets={assetList} inventoryPrinters={inventoryList} />
    </div>
  );
}
