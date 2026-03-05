import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrinterDetail } from "@/components/admin/printer-detail";

export default async function PrinterAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [business, asset, maintenanceLogs, linkedItems] = await Promise.all([
    prisma.lFBusinessSettings.findFirst().catch(() => null),
    prisma.printerAsset.findUnique({ where: { id } }),
    prisma.maintenanceLog.findMany({
      where: { printerAssetId: id },
      orderBy: { date: "desc" },
      include: { partsUsed: true },
    }),
    prisma.inventoryHardwareItem.findMany({
      where: { linkedPrinterId: id, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!asset) notFound();

  const wh = (business?.workingDaysPerMonth ?? 26) * (business?.workingHoursPerDay ?? 8);
  const dep = asset.expectedLifespanHours > 0 ? asset.purchasePriceKes / asset.expectedLifespanHours : 0;
  const maint = wh * 12 > 0 ? asset.annualMaintenanceKes / (wh * 12) : 0;
  const elec = (asset.powerWatts / 1000) * asset.electricityRateKesKwh;
  const remaining = Math.max(0, asset.expectedLifespanHours - asset.hoursUsedTotal);

  const assetSerialized = {
    ...asset,
    purchaseDate: asset.purchaseDate?.toISOString() ?? null,
    warrantyExpiryDate: asset.warrantyExpiryDate?.toISOString() ?? null,
    nextScheduledMaintDate: asset.nextScheduledMaintDate?.toISOString() ?? null,
    depreciationPerHourKes: asset.depreciationPerHourKes ?? dep,
    maintenancePerHourKes: asset.maintenancePerHourKes ?? maint,
    remainingLifespanHours: asset.remainingLifespanHours ?? remaining,
    electricityPerHourKes: elec,
    totalMachinePerHourKes: (asset.depreciationPerHourKes ?? dep) + (asset.maintenancePerHourKes ?? maint) + elec,
  };

  const logsSerialized = maintenanceLogs.map((log) => ({
    id: log.id,
    type: log.type,
    date: log.date.toISOString(),
    performedBy: log.performedBy,
    isExternal: log.isExternal,
    technicianCompany: log.technicianCompany,
    description: log.description,
    labourHours: log.labourHours,
    labourCostKes: log.labourCostKes,
    totalCostKes: log.totalCostKes,
    nextServiceDate: log.nextServiceDate?.toISOString() ?? null,
    nextServiceHours: log.nextServiceHours,
    notes: log.notes,
    createdAt: log.createdAt.toISOString(),
    partsUsed: log.partsUsed,
  }));

  const linkedSerialized = linkedItems.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    priceKes: i.priceKes,
    timeHours: i.timeHours ?? null,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/admin/inventory/hardware/printers" className="text-sm text-primary hover:underline">
          ← Back to Printers & Machines
        </Link>
        <h1 className="font-display text-2xl font-bold mt-1">{asset.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {asset.assetTag}
          {asset.location && ` · ${asset.location}`}
        </p>
      </div>

      <PrinterDetail
        asset={assetSerialized}
        maintenanceLogs={logsSerialized}
        linkedItems={linkedSerialized}
      />
    </div>
  );
}
