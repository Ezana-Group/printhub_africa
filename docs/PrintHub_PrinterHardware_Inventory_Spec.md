# 🖨️ PRINTHUB — PRINTER HARDWARE IN INVENTORY + CALCULATOR INTEGRATION
### Cursor AI Modification Prompt
### printhub.africa | An Ezana Group Company

**Document version:** 1.1 (updated to reflect current implementation)  
**Last updated:** March 2025

---

> **WHAT THIS PROMPT DOES:**
> Moves printer hardware, machine assets, maintenance records, accessories,
> and consumables OUT of Admin → Pricing → Calculator Settings and INTO
> the Inventory section where they belong as physical assets.
> The calculators then read machine specs and costs directly from Inventory.
>
> This builds on top of:
> - `PrintHub_LargeFormat_Inventory_CursorPrompt.md` (existing 5 inventory categories)
> - `PrintHub_Finance_Restructure_CursorPrompt.md` (finance owns overhead/labour)
>
> After this change the split is clean:
>   **Inventory**  → physical assets (printers, accessories, consumables, substrates, ink)
>   **Finance**    → business costs (rent, labour rates, overhead, margins)
>   **Calculators** → logic only (no settings of their own except waste factors)

---

## CURRENT IMPLEMENTATION (PHASE 1) — WHAT EXISTS NOW

The codebase has implemented a **Phase 1** of this spec using a single unified model and simple UI. The full spec below describes the target state; this section describes what is **already built**.

### Implemented now

| Area | Status | Details |
|------|--------|--------|
| **Inventory → Hardware** | ✅ Done | Tab **Hardware** under Admin → Inventory. Add items with **name**, **price (KES)**, **location**. For type "Large format printer" or "3D printer" additional fields are captured (see schema below). |
| **Inventory → Maintenance** | ✅ Done | Tab **Maintenance**. Add items with name, price, **Printer** (dropdown from saved Hardware printers), **Time (hours)**. Cost and time feed into calculator when that printer is selected. |
| **Inventory → Printer Accessories** | ✅ Done | Tab **Printer Accessories**. Same as Maintenance: name, price, **Printer** dropdown, **Time (hours)**. Linked cost and time included in calculator. |
| **Calculator printer source** | ✅ Done | LF and 3D quote calculators **select printer from Inventory → Hardware** (dropdown). No printer data in Calculator Settings. |
| **Linked cost & time in calc** | ✅ Done | When a printer is selected, all Maintenance and Printer Accessories with `linkedPrinterId` = that printer are loaded. Their **price (KES)** is added to effective annual maintenance; their **time (hours)** is added to setup/post-processing time. |
| **Business settings** | ✅ Kept | Labour, overhead, VAT, margins remain in **Admin → Quotes → Large format → Business settings** (not in Inventory). |
| **Sales calculator** | ✅ Done | Sales calculator (Admin → Sales → Calculator) has **3D Printer** dropdown; pricing uses selected printer from inventory. |

### Current data model (Phase 1): `InventoryHardwareItem`

```prisma
model InventoryHardwareItem {
  id          String   @id @default(cuid())
  name        String
  category    String   // HARDWARE | MAINTENANCE | PRINTER_ACCESSORIES
  priceKes    Float    @default(0)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  location    String?  // Hardware only
  linkedPrinterId String?  // Maintenance/Accessories: which printer
  timeHours   Float?       // Maintenance/Accessories: time impact (hrs)

  hardwareType String? // LARGE_FORMAT_PRINTER | THREE_D_PRINTER | null

  // Large format printer (when hardwareType = LARGE_FORMAT_PRINTER)
  model                 String?
  maxPrintWidthM        Float?
  printSpeedSqmPerHour  Float?
  setupTimeHours        Float?
  lifespanHours         Float?
  annualMaintenanceKes  Float?
  powerWatts            Float?
  electricityRateKesKwh Float?

  // 3D printer (when hardwareType = THREE_D_PRINTER)
  maintenancePerYearKes   Float?
  postProcessingTimeHours Float?
  // lifespanHours, powerWatts, electricityRateKesKwh also used for 3D
}
```

### Current API (Phase 1)

- **GET/POST** `/api/admin/inventory/hardware-items` — List/create. Query: `?category=HARDWARE`, `?hardwareType=LARGE_FORMAT_PRINTER` or `THREE_D_PRINTER` for calculator dropdowns.
- **PATCH/DELETE** `/api/admin/inventory/hardware-items/[id]` — Update or soft-deactivate.
- **GET** `/api/calculator/rates/large-format?printerId=xxx` — Rates use printer from Inventory when `printerId` is set; otherwise fallback to `LFPrinterSettings` default.
- **GET** `/api/calculator/rates/3d-print?printerId=xxx` — Same for 3D; linked Maintenance/Accessories cost and time are included.

### Current UI (Phase 1)

- **Admin → Inventory** tabs: **Hardware** | **Maintenance** | **Printer Accessories** | **Large format printing** | **3D printing**.
- **Hardware**: Add item → Name, Price, Location, Type (Generic / Large format printer / 3D printer). For printers: Model, Max print width, Print speed, Setup time, Lifespan (hrs), Annual maintenance (KES), Power (W), Electricity (KES/kWh); 3D also has Maintenance/year, Post-processing time. Table shows Name, Type, Location, Lifespan, Maintenance/yr, Power, Price.
- **Maintenance / Printer Accessories**: Add item → Name, Price, **Printer** (dropdown from Hardware printers), **Time (hours)**. Table shows Name, Printer, Time (hrs), Price.
- **Admin → Quotes → Quote Calculator**: Large format and 3D tabs have **Printer** dropdown (from Inventory → Hardware). Business settings tab only (no printer form).
- **Admin → Sales → Sales calculator**: **3D Printer** dropdown; pricing uses selected printer.

### Not yet implemented (see full spec for target)

- Dedicated `PrinterAsset` model with asset tag, serial number, purchase date, supplier, hours used, remaining lifespan, depreciation/maintenance per hour computed fields.
- `MaintenanceLog` and `MaintenancePartUsed` (per-event maintenance history).
- LFStockCategory enum extension (PRINTER_HARDWARE, PRINTER_ACCESSORY, MAINTENANCE_PART); ThreeDStockCategory.
- Separate routes `/admin/inventory/hardware/printers`, `/admin/inventory/hardware/printers/[id]`, accessories page, maintenance log page.
- Ink channel settings as individual LFStockItems per channel per printer.
- Alerts (maintenance due, warranty expiring, wear part due, lifespan warning).
- Finance integration (maintenance spend in reports, depreciation in P&L from assets).
- Access control (STAFF read-only vs ADMIN for asset financials).

---

## PART 1: WHAT MOVES TO INVENTORY

### The full picture of where everything lands

```
INVENTORY → HARDWARE & MACHINES (Phase 1: Hardware tab + InventoryHardwareItem)
  ├── Printers & Plotters          ← Phase 1: HARDWARE + hardwareType LARGE_FORMAT_PRINTER
  ├── Printer Accessories         ← Phase 1: PRINTER_ACCESSORIES + linkedPrinterId
  ├── Maintenance & Spare Parts   ← Phase 1: MAINTENANCE + linkedPrinterId
  ├── Print Heads & Wear Parts    ← Phase 2: extend model or new categories
  └── 3D Printer Hardware         ← Phase 1: HARDWARE + hardwareType THREE_D_PRINTER

INVENTORY → CONSUMABLES (existing categories — unchanged)
  ├── Substrate Rolls              ← already in inventory ✓
  ├── Rigid Sheets / Boards        ← already in inventory ✓
  ├── Lamination Film Rolls        ← already in inventory ✓
  ├── Inks / Toner                 ← already in inventory ✓
  └── Finishing Hardware           ← already in inventory ✓

FINANCE → BUSINESS COSTS (from previous prompt — unchanged)
  └── Rent, utilities, labour, margins, VAT etc.

CALCULATORS (logic only — no machine or financial settings of their own)
  └── Waste factors, finishing times, packaging cost, min order value
```

---

## PART 2: NEW INVENTORY CATEGORIES TO ADD

*(Phase 1 uses `InventoryHardwareItem.category`: HARDWARE | MAINTENANCE | PRINTER_ACCESSORIES. The enum extensions below are for Phase 2 / full spec.)*

Extend the existing `LFStockCategory` enum and add equivalent for 3D.
Also introduce a unified asset category for hardware assets in Phase 2.

---

### NEW CATEGORY 6: PRINTERS & PLOTTERS (Large Format)

*(Phase 1: implemented as Hardware items with `hardwareType = LARGE_FORMAT_PRINTER`. Phase 2: full PrinterAsset with asset tag, serial, purchase date, hours used, etc.)*

These are the actual printing machines. Each machine is a registered asset.
Tracking them in inventory allows depreciation to be calculated automatically
from purchase price + lifespan hours — the calculator pulls this directly.

**What to track per machine (Phase 2 full list; Phase 1 tracks the calculator-relevant subset):**

| Field | Example | Phase 1 | Notes |
|-------|---------|---------|-------|
| Asset name | "Roland VG3-540 #1" | ✅ name | Friendly name |
| Manufacturer | Roland DG | ❌ | |
| Model | VG3-540 | ✅ model | |
| Serial number | RVG354012345 | ❌ | |
| Max print width | 1.52m | ✅ maxPrintWidthM | Used by calculator |
| Purchase price | KES 1,200,000 | ✅ priceKes | Used for depreciation |
| Purchase date | 15 Jan 2023 | ❌ | |
| Supplier | Printex Kenya | ❌ | |
| Expected lifespan (hours) | 20,000 hrs | ✅ lifespanHours | Used for depreciation |
| Hours used to date | 3,420 hrs | ❌ | |
| Remaining lifespan | 16,580 hrs | ❌ | |
| Annual maintenance contract | KES 120,000 | ✅ annualMaintenanceKes | Used for maintenance cost/hr |
| Power consumption | 600W | ✅ powerWatts | Used for electricity cost |
| Print speed (production) | 15 sqm/hr | ✅ printSpeedSqmPerHour | Used for time calculation |
| Print speed (high quality) | 8 sqm/hr | ❌ | |
| Setup time per job | 0.25 hrs | ✅ setupTimeHours | |
| Status | Active / In Maintenance / Retired | ❌ (isActive only) | |
| Location | Production Floor - Bay 1 | ✅ location | |
| Warranty expiry | 15 Jan 2025 | ❌ | |
| Insurance policy # | INS-2023-0042 | ❌ | |
| Notes | Any relevant notes | ❌ | |

**Depreciation auto-calculation (feeds directly into calculator):**
```
depreciation_cost_per_hour = purchase_price_kes / expected_lifespan_hours
maintenance_cost_per_hour  = annual_maintenance_kes / (working_days × hours_per_day × 12)
electricity_cost_per_hour  = (power_watts / 1000) × Finance.electricityRateKesKwh

MACHINE_COST_PER_HOUR = depreciation + maintenance + electricity
```
Phase 1: Calculator uses `priceKes`, `lifespanHours`, `annualMaintenanceKes` (+ linked Maintenance/Accessories), `powerWatts`, `electricityRateKesKwh` from `InventoryHardwareItem`; same formula in engine.

---

### NEW CATEGORY 7: PRINTER ACCESSORIES (Large Format)

*(Phase 1: PRINTER_ACCESSORIES category with linkedPrinterId and timeHours; cost and time included when printer selected. Phase 2: per-item types and replacement intervals.)*

| Item | Unit | Notes |
|------|------|-------|
| Take-up reel / media winder | Units | Per printer |
| Ink dampers (set) | Sets | Replace every ~200 hrs |
| Wiper blades | Units | Replace every ~100 hrs |
| … | | *(see original spec for full list)* |

---

### NEW CATEGORY 8: MAINTENANCE & SPARE PARTS (Large Format)

*(Phase 1: MAINTENANCE category with linkedPrinterId, priceKes, timeHours. Phase 2: MaintenanceLog per event, parts used linked to stock.)*

| Item | Unit | Notes |
|------|------|-------|
| Print head (Roland/Mimaki) | Units | Most expensive spare part |
| … | | *(see original spec for full list)* |

**Maintenance log (Phase 2):** Every maintenance event recorded with date, machine, type, parts used, labour hours, cost, next scheduled date.

---

### NEW CATEGORY 9: 3D PRINTER HARDWARE

*(Phase 1: Hardware items with `hardwareType = THREE_D_PRINTER`; fields: name, priceKes, location, powerWatts, electricityRateKesKwh, lifespanHours, maintenancePerYearKes, postProcessingTimeHours.)*

**What to track per 3D printer (Phase 2 adds build volume, compatible materials, etc.):**

| Field | Phase 1 | Notes |
|-------|---------|-------|
| Asset name | ✅ name | |
| Printer type | ❌ | FDM / MSLA Resin |
| Purchase price | ✅ priceKes | Depreciation |
| Expected lifespan (hours) | ✅ lifespanHours | |
| Annual maintenance | ✅ maintenancePerYearKes | |
| Power consumption | ✅ powerWatts | |
| Post-processing time | ✅ postProcessingTimeHours | |
| Build volume, compatible materials | ❌ | Phase 2 |

---

### NEW CATEGORY 10: 3D PRINTER ACCESSORIES & WEAR PARTS

*(Phase 1: same as Maintenance/Accessories — PRINTER_ACCESSORIES with linkedPrinterId. Phase 2: wear part replacement intervals, next due dates.)*

*(Full item list in original spec.)*

---

## PART 3: DATABASE SCHEMA ADDITIONS

### Phase 1 (current): `InventoryHardwareItem`

Already implemented — see **CURRENT IMPLEMENTATION** section above. No separate `PrinterAsset` or `MaintenanceLog` yet.

### Phase 2 (full spec): Extend LFStockCategory enum

```prisma
// prisma/schema.prisma — Phase 2

enum LFStockCategory {
  SUBSTRATE_ROLL
  RIGID_SHEET
  LAMINATION
  INK
  FINISHING
  PRINTER_HARDWARE
  PRINTER_ACCESSORY
  MAINTENANCE_PART
}

enum ThreeDStockCategory {
  FILAMENT
  PRINTER_HARDWARE
  PRINTER_ACCESSORY
  WEAR_PART
  RESIN_CONSUMABLE
  SAFETY_PPE
}
```

### Phase 2: New model `PrinterAsset`

*(Full model in original spec — asset tag, serial, purchase date, supplier, hours used, remaining lifespan, depreciationPerHourKes, maintenancePerHourKes, status, MaintenanceLog relation, etc.)*

Use when migrating from the simplified Phase 1 model to full asset lifecycle and maintenance logging.

### Phase 2: New model `MaintenanceLog` and `MaintenancePartUsed`

*(Full model in original spec.)*

### Phase 2: Update `LFStockItem`

Add `printerAssetId`, `replacementIntervalHours`, `lastReplacedAt`, `nextReplacementDue`, `inkChannel`, `bottleVolumeML`, `estimatedSqmPerBottle`, `threeDCategory` as in original spec.

### Migration

Phase 1 already applied: `InventoryHardwareItem` created and used.  
Phase 2: `npx prisma migrate dev --name add_printer_assets_to_inventory` (when implementing full spec).

---

## PART 4: HOW CALCULATORS GET MACHINE DATA (UPDATED FLOW)

### Phase 1 (current)

```
LF Calculator:
  GET /api/calculator/rates/large-format?printerId=<id>
  → If printerId: load InventoryHardwareItem (hardwareType = LARGE_FORMAT_PRINTER)
  → Load linked items (category MAINTENANCE or PRINTER_ACCESSORIES, linkedPrinterId = printerId)
  → effective annualMaintenanceKes += sum(linked.priceKes)
  → effective setupTimeHours += sum(linked.timeHours)
  → Return printer shape expected by lf-calculator-engine (printerName, purchasePriceKes, lifespanHours, etc.)
  → If no printerId: fallback to LFPrinterSettings (default) as before

3D Calculator:
  GET /api/calculator/rates/3d-print?printerId=<id>
  → Same pattern: InventoryHardwareItem (THREE_D_PRINTER) + linked maintenance/accessories
  → effective maintenancePerYearKes += sum(linked.priceKes)
  → effective postProcessingTimeHours += sum(linked.timeHours)
  → If no printerId: fallback to PricingConfig "3dPrinterSettings"
```

Printer list for dropdowns: **GET** `/api/admin/inventory/hardware-items?hardwareType=LARGE_FORMAT_PRINTER` or `?hardwareType=THREE_D_PRINTER` (admin auth required).

### Phase 2 (target)

```
GET /api/admin/inventory/assets/printers
→ Returns all active PrinterAssets with pre-computed depreciationPerHourKes, maintenancePerHourKes, electricityPerHourKes (using Finance rate).
Calculators use same engine signatures; printer parameter comes from PrinterAsset.
```

---

## PART 5: INVENTORY UI — UPDATED STRUCTURE

### Phase 1 (current)

Route: **`/admin/inventory`**

Tabs: **Hardware** | **Maintenance** | **Printer Accessories** | **Large format printing** | **3D printing**

- **Hardware:** Add item (name, price, location, type). For Large format printer: model, max print width, print speed, setup time, lifespan (hrs), annual maintenance (KES), power (W), electricity (KES/kWh). For 3D printer: power, electricity, lifespan, maintenance/year (KES), post-processing time (hrs). Table: Name, Type, Location, Lifespan (hrs), Maintenance/yr (KES), Power (W), Price.
- **Maintenance:** Add item (name, price, **Printer** dropdown, **Time (hours)**). Table: Name, Printer, Time (hrs), Price.
- **Printer Accessories:** Same as Maintenance.

### Phase 2 (full spec)

- **Hardware & Assets** section: **Printers & Machines** (`/admin/inventory/hardware/printers`), **Accessories**, **Maintenance Parts**, **Maintenance Log**.
- Printer list cards with lifespan bar, cost-per-hour breakdown, status, next maintenance.
- Printer detail page: Overview, Specs & Costs, Maintenance History, Parts & Accessories, Usage Stats.
- Register new printer: multi-step form (identity, specs, financial, maintenance schedule).
- Maintenance log: consolidated view, filter by printer/type/date, log maintenance with parts used.

*(Full wireframes in original spec.)*

---

## PART 6: WHAT GETS REMOVED FROM CALCULATOR SETTINGS

### Phase 1 (done)

- **Removed from Large format calculator UI:** Printer settings form (name, speed, setup time, lifespan, annual maintenance, power, electricity). Printer data now comes from Inventory → Hardware; admin selects printer in calculator.
- **Removed from 3D calculator UI:** Printer Settings tab (machine model, power, electricity, purchase price, lifespan, maintenance, post-processing time, etc.). Printer selection from Inventory → Hardware.
- **Kept:** Business settings (labour, overhead, VAT, margins, wastage, etc.) in **Large format → Business settings** tab. Calculator logic (waste factors, finishing times, packaging, min order) unchanged.

### Phase 2 (when applicable)

- Remove `LFPrinterSettings` and `ThreeDPrinterSettings` (or archive) after data migrated to `PrinterAsset`.
- All printer hardware fields live only in Inventory → Hardware & Assets.

---

## PART 7: INK CHANNEL SETTINGS — MOVE TO PRINTER ACCESSORIES (Phase 2)

*(Phase 1: ink cost still from existing logic / LFPrinterSettings inkChannelSettings or default. Phase 2: each ink channel as LFStockItem with printerAssetId, bottleVolumeML, estimatedSqmPerBottle; calculator derives ink cost from inventory.)*

*(Full description in original spec.)*

---

## PART 8: CALCULATOR UI UPDATES

### Phase 1 (done)

- **Printer selector** in Admin LF Calculator and Admin 3D Calculator: dropdown lists printers from Inventory → Hardware (by type). Selection drives cost calculation.
- **Sales calculator:** 3D Printer dropdown; pricing uses selected printer.
- No machine cost breakdown panel yet (Phase 2: show depreciation/maintenance/electricity per hour and link to printer in inventory).

### Phase 2 (full spec)

- Printer selector shows status, hours used, cost/hr, maintenance due warning.
- Read-only machine cost summary with “[View printer in inventory →]” link.
- Warn if printer is IN_MAINTENANCE; hide RETIRED.

---

## PART 9: ALERTS & NOTIFICATIONS (Phase 2)

*(All alerts in original spec — maintenance due, overdue, warranty expiring, wear part due, lifespan warning, high maintenance cost. Not yet implemented.)*

---

## PART 10: FINANCE INTEGRATION (Phase 2)

*(Maintenance costs in Finance reports, depreciation in P&L from PrinterAsset, maintenance budget vs actual. Not yet implemented.)*

---

## PART 11: FULL IMPLEMENTATION CHECKLIST

### Database

| Item | Phase 1 | Phase 2 |
|------|--------|--------|
| InventoryHardwareItem (HARDWARE, MAINTENANCE, PRINTER_ACCESSORIES) | ✅ | — |
| location, linkedPrinterId, timeHours on hardware items | ✅ | — |
| Extend LFStockCategory enum | ❌ | [ ] |
| ThreeDStockCategory enum | ❌ | [ ] |
| PrinterAsset model | ❌ | [ ] |
| MaintenanceLog, MaintenancePartUsed | ❌ | [ ] |
| LFStockItem: printerAssetId, inkChannel, replacement intervals, etc. | ❌ | [ ] |
| Migrate LFPrinterSettings → PrinterAsset | ❌ | [ ] |
| Seed default printers | ❌ | [ ] (or use existing LFPrinterSettings default) |

### API

| Item | Phase 1 | Phase 2 |
|------|--------|--------|
| GET/POST /api/admin/inventory/hardware-items | ✅ | — |
| PATCH/DELETE /api/admin/inventory/hardware-items/[id] | ✅ | — |
| GET /api/calculator/rates/large-format?printerId= | ✅ | — |
| GET /api/calculator/rates/3d-print?printerId= | ✅ | — |
| Linked maintenance/accessories cost & time in rates | ✅ | — |
| GET /api/admin/inventory/assets/printers | ❌ | [ ] |
| POST/PATCH printers, maintenance log APIs | ❌ | [ ] |
| Ink from LFStockItem per channel | ❌ | [ ] |

### Calculator engine

| Item | Phase 1 | Phase 2 |
|------|--------|--------|
| LF calculator uses printer from inventory (by printerId) | ✅ | — |
| 3D calculator uses printer from inventory (by printerId) | ✅ | — |
| Linked maintenance/accessories in effective costs | ✅ | — |
| Printer parameter as PrinterAssetForCalc shape | ⚠️ Same shape, source is InventoryHardwareItem | [ ] optional rename |
| Ink cost from inventory (per channel) | ❌ | [ ] |

### Inventory UI

| Item | Phase 1 | Phase 2 |
|------|--------|--------|
| Tabs: Hardware, Maintenance, Printer Accessories | ✅ | — |
| Hardware: name, price, location, type, printer specs | ✅ | — |
| Maintenance/Accessories: printer dropdown, time (hrs) | ✅ | — |
| Table columns: Location, Lifespan, Maintenance/yr, Power, Printer, Time | ✅ | — |
| Hardware & Assets section (printers list page) | ❌ | [ ] |
| Printer detail page (tabs) | ❌ | [ ] |
| Register new printer (multi-step) | ❌ | [ ] |
| Accessories page by printer | ❌ | [ ] |
| Maintenance log page | ❌ | [ ] |

### Calculator UI

| Item | Phase 1 | Phase 2 |
|------|--------|--------|
| Printer dropdown in LF calculator | ✅ | — |
| Printer dropdown in 3D calculator | ✅ | — |
| Printer dropdown in Sales calculator (3D) | ✅ | — |
| Remove printer form from LF/3D calculator settings | ✅ | — |
| Machine cost breakdown with “[View in inventory →]” | ❌ | [ ] |
| Maintenance due / status in printer selector | ❌ | [ ] |

### Calculator settings cleanup

| Item | Phase 1 | Phase 2 |
|------|--------|--------|
| Printer hardware fields removed from calculator UI | ✅ | — |
| Business settings kept (Labour, overhead, VAT) | ✅ | — |
| Link “Machine costs from Inventory” in settings | ❌ | [ ] |

### Alerts & notifications

| Item | Phase 2 |
|------|--------|
| Maintenance due / overdue, warranty, wear part, lifespan, high cost | [ ] |

### Finance integration

| Item | Phase 2 |
|------|--------|
| Maintenance spend in Finance reports | [ ] |
| Depreciation in P&L from PrinterAsset | [ ] |

### Access control

| Item | Phase 2 |
|------|--------|
| ADMIN vs STAFF for hardware financials vs maintenance log | [ ] |

---

## SUMMARY: CURRENT VS TARGET ARCHITECTURE

**Current (Phase 1):**

```
Admin → Inventory
  Tabs: Hardware | Maintenance | Printer Accessories | Large format | 3D printing
  Hardware: printers (LF/3D) + generic items; location, full printer specs.
  Maintenance / Accessories: name, price, linked printer, time (hrs).

Admin → Quotes → Quote Calculator
  Large format / 3D: select Printer from Inventory → Hardware.
  Business settings tab only (no printer form).

Admin → Sales → Sales calculator
  Select 3D Printer from Inventory → Hardware.

Calculators:
  GET rates with ?printerId= → printer + linked maintenance/accessories from InventoryHardwareItem.
  Fallback: LFPrinterSettings (LF) or PricingConfig (3D) when no printerId.
```

**Target (Phase 2):**

```
Admin → Inventory → Hardware & Assets
  Printers & Machines (PrinterAsset), Accessories, Maintenance Parts, Maintenance Log.
  Full asset lifecycle, maintenance events, wear part replacement, alerts.

Calculators:
  Printer data from PrinterAsset; ink from LFStockItem per channel.
  Finance: depreciation and maintenance in P&L and reports.
```

---

*PrintHub Hardware Inventory Spec v1.1 | printhub.africa | An Ezana Group Company*
