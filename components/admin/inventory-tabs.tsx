"use client";

import { useState } from "react";
import { LargeFormatInventorySection } from "@/components/admin/large-format-inventory-section";
import { Inventory3DSection } from "@/components/admin/inventory-3d-section";
import { InventoryHardwareSection, type HardwareItemSerialized } from "@/components/admin/inventory-hardware-section";
import { ShopProductsInventorySection, type ShopProductRow } from "@/components/admin/shop-products-inventory-section";
import { Package, LayoutTemplate, Cpu, Wrench, Cable, Box } from "lucide-react";
import { useEffect } from "react";

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
  brand: string | null;
  quantity: number;
  lowStockThreshold: number;
  location: string | null;
  costPerKgKes: number | null;
  unitCostKes: number | null;
  notes: string | null;
};

const TOP_TABS = [
  { id: "shop" as const, label: "Shop Products", icon: Package, description: "Finished units" },
  { id: "print-materials" as const, label: "Print Materials", icon: LayoutTemplate, description: "Raw materials for print services" },
  { id: "hardware" as const, label: "Hardware & Assets", icon: Cpu, description: "Printers, machines, spare parts" },
];

const HARDWARE_SUB_TABS = [
  { id: "hardware" as const, label: "Hardware", icon: Cpu },
  { id: "maintenance" as const, label: "Maintenance", icon: Wrench },
  { id: "accessories" as const, label: "Printer Accessories", icon: Cable },
];

const PRINT_MATERIALS_SUB_TABS = [
  { id: "large-format" as const, label: "Large Format", icon: LayoutTemplate },
  { id: "3d-printing" as const, label: "3D Printing", icon: Box },
];

export function InventoryTabs({
  shopProducts = [],
  lfStockItems,
  machines: _machines,
  consumables,
  hardwareItems,
  printerAssets = [],
  categories = [],
}: {
  shopProducts?: ShopProductRow[];
  lfStockItems: LFStockItemSerialized[];
  machines: Machine[];
  consumables: ThreeDConsumable[];
  hardwareItems: HardwareItemSerialized[];
  printerAssets?: { id: string; name: string }[];
  categories?: { id: string; name: string; slug: string }[];
}) {
  void _machines;
  const [topTab, setTopTab] = useState<"shop" | "print-materials" | "hardware">("shop");
  const [hardwareSubTab, setHardwareSubTab] = useState<"hardware" | "maintenance" | "accessories">("hardware");
  const [printMaterialsSubTab, setPrintMaterialsSubTab] = useState<"large-format" | "3d-printing">("large-format");
  const [largeFormatEnabled, setLargeFormatEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/public/service-flags")
      .then((res) => (res.ok ? res.json() : null))
      .then((flags: { largeFormatEnabled?: boolean } | null) => {
        const enabled = Boolean(flags?.largeFormatEnabled);
        setLargeFormatEnabled(enabled);
        if (!enabled) {
          setPrintMaterialsSubTab("3d-printing");
        }
      })
      .catch(() => {
        setLargeFormatEnabled(false);
        setPrintMaterialsSubTab("3d-printing");
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border flex-wrap">
        {TOP_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTopTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              topTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {topTab === "shop" && (
        <ShopProductsInventorySection products={shopProducts} categories={categories} />
      )}

      {topTab === "print-materials" && (
        <>
          <div className="flex gap-2 border-b border-border/50 flex-wrap">
            {(largeFormatEnabled
              ? PRINT_MATERIALS_SUB_TABS
              : PRINT_MATERIALS_SUB_TABS.filter((tab) => tab.id !== "large-format")
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPrintMaterialsSubTab(id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  printMaterialsSubTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          {printMaterialsSubTab === "large-format" && largeFormatEnabled && (
            <LargeFormatInventorySection lfStockItems={lfStockItems} />
          )}
          {printMaterialsSubTab === "3d-printing" && (
            <Inventory3DSection consumables={consumables} />
          )}
        </>
      )}

      {topTab === "hardware" && (
        <>
          <div className="flex gap-2 border-b border-border/50 flex-wrap">
            {HARDWARE_SUB_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setHardwareSubTab(id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  hardwareSubTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          {hardwareSubTab === "hardware" && (
            <InventoryHardwareSection
              category="HARDWARE"
              title="Hardware"
              description="Printers and other equipment. Large format and 3D printers added here are available in the Quote calculator for pricing."
              initialItems={hardwareItems}
              printerAssets={printerAssets}
            />
          )}
          {hardwareSubTab === "maintenance" && (
            <InventoryHardwareSection
              category="MAINTENANCE"
              title="Maintenance"
              description="Maintenance items and services. Add name and price."
              initialItems={hardwareItems}
              printerAssets={printerAssets}
            />
          )}
          {hardwareSubTab === "accessories" && (
            <InventoryHardwareSection
              category="PRINTER_ACCESSORIES"
              title="Printer Accessories"
              description="Accessories and consumables. Add name and price."
              initialItems={hardwareItems}
              printerAssets={printerAssets}
            />
          )}
        </>
      )}
    </div>
  );
}
