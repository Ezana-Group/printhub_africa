"use client";

import { useState } from "react";
import { LargeFormatInventorySection } from "@/components/admin/large-format-inventory-section";
import { Inventory3DSection } from "@/components/admin/inventory-3d-section";
import { InventoryHardwareSection, type HardwareItemSerialized } from "@/components/admin/inventory-hardware-section";
import { LayoutTemplate, Box, Cpu, Wrench, Cable } from "lucide-react";

export type LFStockItemSerialized = {
  id: string;
  code: string;
  name: string;
  category: string;
  unitType: string;
  rollWidthM: number | null;
  quantityOnHand: number;
  lowStockThreshold: number;
  costPerUnit: number;
  lastPurchasePriceKes: number | null;
  averageCostKes: number;
  lastReceivedAt: string | null;
};

type Machine = {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string | null;
  purchasePriceKes: number | null;
};
type ThreeDConsumable = {
  id: string;
  kind: string;
  name: string;
  specification: string | null;
  quantity: number;
  lowStockThreshold: number;
  location: string | null;
  costPerKgKes: number | null;
  unitCostKes: number | null;
};

const TABS = [
  { id: "hardware" as const, label: "Hardware", icon: Cpu },
  { id: "maintenance" as const, label: "Maintenance", icon: Wrench },
  { id: "accessories" as const, label: "Printer Accessories", icon: Cable },
  { id: "large-format" as const, label: "Large format printing", icon: LayoutTemplate },
  { id: "3d-printing" as const, label: "3D printing", icon: Box },
];

export function InventoryTabs({
  lfStockItems,
  machines: _machines, // reserved for future use
  consumables,
  hardwareItems,
  printerAssets = [],
}: {
  lfStockItems: LFStockItemSerialized[];
  machines: Machine[];
  consumables: ThreeDConsumable[];
  hardwareItems: HardwareItemSerialized[];
  printerAssets?: { id: string; name: string }[];
}) {
  void _machines;
  const [tab, setTab] = useState<"hardware" | "maintenance" | "accessories" | "large-format" | "3d-printing">("hardware");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "hardware" && (
        <InventoryHardwareSection
          category="HARDWARE"
          title="Hardware"
          description="Printers and other equipment. Large format and 3D printers added here are available in the Quote calculator for pricing."
          initialItems={hardwareItems}
          printerAssets={printerAssets}
        />
      )}
      {tab === "maintenance" && (
        <InventoryHardwareSection
          category="MAINTENANCE"
          title="Maintenance"
          description="Maintenance items and services. Add name and price."
          initialItems={hardwareItems}
          printerAssets={printerAssets}
        />
      )}
      {tab === "accessories" && (
        <InventoryHardwareSection
          category="PRINTER_ACCESSORIES"
          title="Printer Accessories"
          description="Accessories and consumables. Add name and price."
          initialItems={hardwareItems}
          printerAssets={printerAssets}
        />
      )}
      {tab === "large-format" && (
        <LargeFormatInventorySection lfStockItems={lfStockItems} />
      )}
      {tab === "3d-printing" && (
        <Inventory3DSection consumables={consumables} />
      )}
    </div>
  );
}
