import path from "node:path";
import { config } from "dotenv";

// Load from project root (seed may run with cwd = prisma/ when using npx prisma db seed)
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient, UserRole, ProductType, PrintMaterialType, PrinterType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

const TEST_PASSWORD = "Test@12345";
const ADMIN_PASSWORD = "Admin@Printhub2025!";

async function main() {
  const defaultHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Super Admin (existing account – password unchanged if already present)
  const admin = await prisma.user.upsert({
    where: { email: "admin@printhub.africa" },
    update: {},
    create: {
      email: "admin@printhub.africa",
      name: "PrintHub Super Admin",
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("Super Admin:", admin.email);

  // Admin (non-super)
  const admin2 = await prisma.user.upsert({
    where: { email: "admin2@printhub.africa" },
    update: {},
    create: {
      email: "admin2@printhub.africa",
      name: "PrintHub Admin",
      passwordHash: defaultHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("Admin:", admin2.email);

  // Staff – Sales
  const staffSales = await prisma.user.upsert({
    where: { email: "sales@printhub.africa" },
    update: {},
    create: {
      email: "sales@printhub.africa",
      name: "Sales User",
      passwordHash: defaultHash,
      role: UserRole.STAFF,
      emailVerified: new Date(),
    },
  });
  await prisma.staff.upsert({
    where: { userId: staffSales.id },
    update: { department: "Sales", position: "Sales Rep" },
    create: {
      userId: staffSales.id,
      department: "Sales",
      position: "Sales Rep",
      permissions: ["orders_view", "orders_edit", "products_view", "inventory_view"],
    },
  });
  console.log("Staff (Sales):", staffSales.email);

  // Staff – Marketing
  const staffMarketing = await prisma.user.upsert({
    where: { email: "marketing@printhub.africa" },
    update: {},
    create: {
      email: "marketing@printhub.africa",
      name: "Marketing User",
      passwordHash: defaultHash,
      role: UserRole.STAFF,
      emailVerified: new Date(),
    },
  });
  await prisma.staff.upsert({
    where: { userId: staffMarketing.id },
    update: { department: "Marketing", position: "Marketing Lead" },
    create: {
      userId: staffMarketing.id,
      department: "Marketing",
      position: "Marketing Lead",
      permissions: ["products_view", "products_edit", "orders_view", "orders_edit"],
    },
  });
  console.log("Staff (Marketing):", staffMarketing.email);

  // Customer (regular user)
  const customer = await prisma.user.upsert({
    where: { email: "customer@printhub.africa" },
    update: {},
    create: {
      email: "customer@printhub.africa",
      name: "Test Customer",
      passwordHash: defaultHash,
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });
  console.log("Customer:", customer.email);

  // Categories
  const catLargeFormat = await prisma.category.upsert({
    where: { slug: "large-format" },
    update: {},
    create: {
      name: "Large Format Printing",
      slug: "large-format",
      description: "Banners, signage, vehicle wraps, canvas, and more",
      sortOrder: 1,
    },
  });
  const cat3D = await prisma.category.upsert({
    where: { slug: "3d-printing" },
    update: {},
    create: {
      name: "3D Printing",
      slug: "3d-printing",
      description: "Custom and ready-made 3D printed products",
      sortOrder: 2,
    },
  });
  const catMerch = await prisma.category.upsert({
    where: { slug: "merchandise" },
    update: {},
    create: {
      name: "3D Printed Merchandise",
      slug: "merchandise",
      description: "Ready-made 3D printed items",
      parentId: cat3D.id,
      sortOrder: 1,
    },
  });
  console.log("Categories created");

  // Sample products
  await prisma.product.upsert({
    where: { slug: "sample-banner-1m" },
    update: {},
    create: {
      name: "Sample Vinyl Banner 1m²",
      slug: "sample-banner-1m",
      shortDescription: "1 square metre vinyl banner, full colour",
      description: "Ideal for events and promotions. 1m² vinyl banner with eyelets.",
      categoryId: catLargeFormat.id,
      productType: ProductType.LARGE_FORMAT,
      images: [],
      basePrice: 2500,
      comparePrice: 3000,
      sku: "LF-VINYL-1M",
      stock: 0,
      minOrderQty: 1,
      materials: ["Vinyl"],
      colors: ["Full colour"],
      isActive: true,
      isFeatured: true,
      tags: ["banner", "vinyl", "large-format"],
    },
  });

  await prisma.product.upsert({
    where: { slug: "3d-printed-keyholder" },
    update: {},
    create: {
      name: "3D Printed Key Holder",
      slug: "3d-printed-keyholder",
      shortDescription: "Modern key holder, PLA",
      description: "Handy key holder for home or office. Printed in PLA.",
      categoryId: catMerch.id,
      productType: ProductType.READYMADE_3D,
      images: [],
      basePrice: 450,
      comparePrice: 600,
      sku: "3D-KH-001",
      stock: 50,
      minOrderQty: 1,
      materials: ["PLA"],
      colors: ["Black", "White", "Orange"],
      isActive: true,
      isFeatured: true,
      tags: ["3d", "keyholder", "home"],
    },
  });
  console.log("Sample products created");

  // 3D Print materials — doc 2.2 (slug, density, minChargeGrams)
  const threeDMaterials: { slug: string; name: string; type: PrintMaterialType; pricePerGram: number; density: number; minChargeGrams: number }[] = [
    { slug: "PLA_STD", name: "PLA (Standard)", type: PrintMaterialType.PLA, pricePerGram: 0.15, density: 1.24, minChargeGrams: 10 },
    { slug: "PLA_PLUS", name: "PLA+ (Enhanced)", type: PrintMaterialType.PLA, pricePerGram: 0.18, density: 1.24, minChargeGrams: 10 },
    { slug: "PETG", name: "PETG", type: PrintMaterialType.PETG, pricePerGram: 0.2, density: 1.27, minChargeGrams: 10 },
    { slug: "ABS", name: "ABS", type: PrintMaterialType.ABS, pricePerGram: 0.18, density: 1.05, minChargeGrams: 10 },
    { slug: "TPU", name: "TPU (Flexible)", type: PrintMaterialType.TPU, pricePerGram: 0.35, density: 1.2, minChargeGrams: 10 },
    { slug: "RESIN_STD", name: "Resin (Standard)", type: PrintMaterialType.RESIN, pricePerGram: 0.45, density: 1.1, minChargeGrams: 5 },
  ];
  for (let i = 0; i < threeDMaterials.length; i++) {
    const m = threeDMaterials[i];
    const existing = await prisma.printMaterial.findFirst({ where: { slug: m.slug } });
    const data = {
      name: m.name,
      type: m.type,
      colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"],
      pricePerGram: m.pricePerGram,
      density: m.density,
      minChargeGrams: m.minChargeGrams,
      leadTimeDays: 3,
      sortOrder: i,
      isActive: true,
    };
    if (existing) {
      await prisma.printMaterial.update({ where: { id: existing.id }, data });
    } else {
      await prisma.printMaterial.create({ data: { ...data, slug: m.slug } });
    }
  }
  console.log("Print materials (3D) created");

  // Printing mediums (large format) — doc 1.2 (placeholders; admin can update)
  const largeFormatMaterials = [
    { slug: "VINYL_IN", name: "Standard Vinyl (Indoor)", pricePerSqm: 800, minWidth: 30, maxWidth: 320, sortOrder: 1 },
    { slug: "VINYL_OUT", name: "Standard Vinyl (Outdoor)", pricePerSqm: 950, minWidth: 30, maxWidth: 320, sortOrder: 2 },
    { slug: "BACKLIT", name: "Backlit Film", pricePerSqm: 1400, minWidth: 30, maxWidth: 320, sortOrder: 3 },
    { slug: "PERF", name: "One-Way Vision / Perforated Vinyl", pricePerSqm: 1600, minWidth: 50, maxWidth: 320, sortOrder: 4 },
    { slug: "MESH", name: "Mesh Banner", pricePerSqm: 1100, minWidth: 50, maxWidth: 500, sortOrder: 5 },
    { slug: "CANVAS", name: "Canvas (Matte)", pricePerSqm: 1800, minWidth: 30, maxWidth: 320, sortOrder: 6 },
    { slug: "FABRIC", name: "Fabric / Textile", pricePerSqm: 2200, minWidth: 50, maxWidth: 320, sortOrder: 7 },
    { slug: "FLEX_STD", name: "Flex Banner (Standard)", pricePerSqm: 650, minWidth: 50, maxWidth: 500, sortOrder: 8 },
    { slug: "FLEX_PRE", name: "Flex Banner (Premium)", pricePerSqm: 900, minWidth: 50, maxWidth: 500, sortOrder: 9 },
    { slug: "CORF", name: "Corflute / Corrugated Plastic", pricePerSqm: 1200, minWidth: 30, maxWidth: 150, sortOrder: 10 },
    { slug: "FOAM_3", name: "Foam Board (3mm)", pricePerSqm: 1500, minWidth: 30, maxWidth: 120, sortOrder: 11 },
    { slug: "FOAM_5", name: "Foam Board (5mm)", pricePerSqm: 1800, minWidth: 30, maxWidth: 120, sortOrder: 12 },
    { slug: "VEH_WRAP", name: "Vehicle Wrap Vinyl", pricePerSqm: 2500, minWidth: 50, maxWidth: 160, sortOrder: 13 },
    { slug: "FLOOR", name: "Floor Graphic Vinyl", pricePerSqm: 1900, minWidth: 30, maxWidth: 150, sortOrder: 14 },
    { slug: "WALLPPR", name: "Wallpaper (Non-woven)", pricePerSqm: 2000, minWidth: 50, maxWidth: 320, sortOrder: 15 },
  ];
  for (const m of largeFormatMaterials) {
    const existing = await prisma.printingMedium.findFirst({
      where: { slug: m.slug },
    });
    if (existing) {
      await prisma.printingMedium.update({
        where: { id: existing.id },
        data: {
          name: m.name,
          pricePerSqMeter: m.pricePerSqm,
          sortOrder: m.sortOrder,
          minWidth: (m as { minWidth?: number }).minWidth ?? undefined,
          maxWidth: (m as { maxWidth?: number }).maxWidth ?? undefined,
        },
      });
    } else {
      await prisma.printingMedium.create({
        data: {
          slug: m.slug,
          name: m.name,
          pricePerSqMeter: m.pricePerSqm,
          sortOrder: m.sortOrder,
          minWidth: (m as { minWidth?: number }).minWidth ?? undefined,
          maxWidth: (m as { maxWidth?: number }).maxWidth ?? undefined,
          isActive: true,
        },
      });
    }
  }
  console.log("Printing mediums (large format quote) created");

  // Lamination (KES per sqm) — doc 1.3
  const lamData = [
    { slug: "NONE", name: "None", pricePerSqm: 0 },
    { slug: "LAM_GLOSS", name: "Gloss Lamination", pricePerSqm: 300 },
    { slug: "LAM_MATTE", name: "Matte Lamination", pricePerSqm: 350 },
    { slug: "LAM_ASCRATCH", name: "Anti-scratch Matte", pricePerSqm: 500 },
  ];
  for (const l of lamData) {
    const existing = await prisma.laminationType.findFirst({ where: { slug: l.slug } });
    if (existing) {
      await prisma.laminationType.update({
        where: { id: existing.id },
        data: { name: l.name, pricePerSqm: l.pricePerSqm },
      });
    } else {
      await prisma.laminationType.create({ data: l });
    }
  }

  // Large format finishing (per unit) — doc 1.4
  const finishingData = [
    { code: "NONE", name: "No finishing", pricePerUnit: 0 },
    { code: "EYELET_STD", name: "Eyelets (every 50cm)", pricePerUnit: 150 },
    { code: "EYELET_HD", name: "Eyelets heavy duty (every 30cm)", pricePerUnit: 250 },
    { code: "HEM_4", name: "Hemming (all 4 sides)", pricePerUnit: 200 },
    { code: "HEM_2", name: "Hemming (top & bottom)", pricePerUnit: 120 },
    { code: "POLE_PKT", name: "Pole pockets (top & bottom)", pricePerUnit: 250 },
    { code: "POLE_TOP", name: "Pole pocket (top only)", pricePerUnit: 150 },
    { code: "ROPE", name: "Rope / bungee (set of 4)", pricePerUnit: 100 },
    { code: "BATTEN", name: "Wooden batten (top & bottom)", pricePerUnit: 350 },
    { code: "ROLLUP", name: "Roll-up cassette", pricePerUnit: 800 },
    { code: "GR_ROPE", name: "Grommets + rope combo", pricePerUnit: 200 },
  ];
  for (let i = 0; i < finishingData.length; i++) {
    const f = finishingData[i];
    await prisma.largeFormatFinishing.upsert({
      where: { code: f.code },
      update: { name: f.name, pricePerUnit: f.pricePerUnit, sortOrder: i },
      create: { ...f, sortOrder: i },
    });
  }

  // Design service (flat fee) — doc 1.5
  const designData = [
    { code: "NONE", name: "No design (customer provides file)", flatFee: 0 },
    { code: "DESIGN_MIN", name: "Minor file adjustment", flatFee: 500 },
    { code: "DESIGN_BASIC", name: "Template-based design", flatFee: 1500 },
    { code: "DESIGN_STD", name: "Custom design (standard)", flatFee: 3500 },
    { code: "DESIGN_COMP", name: "Custom design (complex)", flatFee: 7500 },
    { code: "DESIGN_VEC", name: "Vector conversion", flatFee: 1200 },
  ];
  for (let i = 0; i < designData.length; i++) {
    const d = designData[i];
    await prisma.designServiceOption.upsert({
      where: { code: d.code },
      update: { name: d.name, flatFee: d.flatFee, sortOrder: i },
      create: { ...d, sortOrder: i },
    });
  }

  // Turnaround (surcharge %) — doc 1.6
  const turnaroundData = [
    { code: "STD", name: "Standard (3–5 days)", surchargePercent: 0, serviceType: "LARGE_FORMAT" },
    { code: "EXPRESS_1", name: "Next day", surchargePercent: 30, serviceType: "LARGE_FORMAT" },
    { code: "EXPRESS_SD", name: "Same day", surchargePercent: 60, serviceType: "LARGE_FORMAT" },
    { code: "EXPRESS_WE", name: "Weekend / holiday rush", surchargePercent: 75, serviceType: "LARGE_FORMAT" },
  ];
  for (let i = 0; i < turnaroundData.length; i++) {
    const t = turnaroundData[i];
    await prisma.turnaroundOption.upsert({
      where: { code: t.code },
      update: { name: t.name, surchargePercent: t.surchargePercent, serviceType: t.serviceType, sortOrder: i },
      create: { ...t, sortOrder: i },
    });
  }

  // Pricing config
  const configs = [
    { key: "vatRate", valueJson: "0.16" },
    { key: "minOrderLargeFormat", valueJson: "500" },
    { key: "minOrder3D", valueJson: "800" },
    { key: "minAreaSqmLargeFormat", valueJson: "0.5" },
  ];
  for (const c of configs) {
    await prisma.pricingConfig.upsert({
      where: { key: c.key },
      update: { valueJson: c.valueJson },
      create: c,
    });
  }

  // Large format cost engine — printer & business settings
  const defaultLfPrinter = await prisma.lFPrinterSettings.findFirst({ where: { isDefault: true } });
  if (!defaultLfPrinter) {
    await prisma.lFPrinterSettings.create({
      data: {
        name: "Roland VG3-540",
        model: "VG3-540",
        isActive: true,
        isDefault: true,
        maxPrintWidthM: 1.52,
        printSpeedSqmPerHour: 15,
        printSpeedHighQualSqmHr: 8,
        setupTimeHours: 0.25,
        purchasePriceKes: 1_200_000,
        lifespanHours: 20_000,
        annualMaintenanceKes: 120_000,
        powerWatts: 600,
        electricityRateKesKwh: 24,
        inkChannelSettings: {
          C: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
          M: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
          Y: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
          K: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
        },
      },
    });
  }

  const existingBusiness = await prisma.lFBusinessSettings.findFirst();
  if (!existingBusiness) {
    await prisma.lFBusinessSettings.create({
      data: {
        labourRateKesPerHour: 200,
        finishingTimeEyeletStd: 0.1,
        finishingTimeEyeletHeavy: 0.2,
        finishingTimeHemAll4: 0.25,
        finishingTimeHemTop2: 0.15,
        finishingTimePole: 0.2,
        finishingTimeRope: 0.1,
        monthlyRentKes: 35_000,
        monthlyUtilitiesKes: 8_000,
        monthlyInsuranceKes: 4_000,
        monthlyOtherKes: 3_000,
        workingDaysPerMonth: 26,
        workingHoursPerDay: 8,
        wastageBufferPercent: 3,
        substrateWasteFactor: 1.05,
        rigidSheetWasteFactor: 1.1,
        defaultProfitMarginPct: 40,
        vatRatePct: 16,
        minOrderValueKes: 500,
      },
    });
  }
  console.log("LF cost engine settings seeded");

  // Default printer assets (so quote calculator has printers out of the box)
  const existingAssetCount = await prisma.printerAsset.count();
  if (existingAssetCount === 0) {
    const wh = 26 * 8; // working hours per month
    await prisma.printerAsset.create({
      data: {
        assetTag: "ASSET-LF-001",
        name: "Roland VG3-540 (default)",
        manufacturer: "Roland",
        model: "VG3-540",
        printerType: PrinterType.LARGE_FORMAT,
        location: "Workshop",
        maxPrintWidthM: 1.52,
        powerWatts: 600,
        electricityRateKesKwh: 24,
        productionSpeed: 15,
        highQualitySpeed: 8,
        setupTimeHours: 0.25,
        purchasePriceKes: 1_200_000,
        expectedLifespanHours: 20_000,
        annualMaintenanceKes: 120_000,
        hoursUsedTotal: 0,
        remainingLifespanHours: 20_000,
        depreciationPerHourKes: 60,
        maintenancePerHourKes: 120_000 / (wh * 12),
        isDefault: true,
      },
    });
    await prisma.printerAsset.create({
      data: {
        assetTag: "ASSET-3D-001",
        name: "FDM Printer (default)",
        printerType: PrinterType.FDM,
        location: "Workshop",
        buildVolumeX: 220,
        buildVolumeY: 220,
        buildVolumeZ: 250,
        powerWatts: 350,
        electricityRateKesKwh: 24,
        productionSpeed: 18,
        setupTimeHours: 0.25,
        postProcessingTimeHours: 0.5,
        compatibleMaterials: ["PLA", "PETG", "ABS"],
        purchasePriceKes: 180_000,
        expectedLifespanHours: 5_000,
        annualMaintenanceKes: 24_000,
        hoursUsedTotal: 0,
        remainingLifespanHours: 5_000,
        depreciationPerHourKes: 36,
        maintenancePerHourKes: 24_000 / (wh * 12),
      },
    });
    console.log("Default printer assets (LF + 3D) created");
  }

  // LF stock items (inventory-linked costs for calculator)
  const lfStockItems = [
    { code: "VINYL_OUTDOOR_152", name: "Outdoor Vinyl (Calendared) 1.52m", category: "SUBSTRATE_ROLL", unitType: "ROLL_LM", rollWidthM: 1.52, averageCostKes: 178.5, quantityOnHand: 50, lowStockThreshold: 10 },
    { code: "VINYL_INDOOR_152", name: "Indoor Vinyl 1.52m", category: "SUBSTRATE_ROLL", unitType: "ROLL_LM", rollWidthM: 1.52, averageCostKes: 120, quantityOnHand: 40, lowStockThreshold: 10 },
    { code: "LAM_GLOSS", name: "Gloss Lamination Film", category: "LAMINATION", unitType: "ROLL_LM", rollWidthM: 1.52, averageCostKes: 90, quantityOnHand: 30, lowStockThreshold: 5 },
    { code: "LAM_MATTE", name: "Matte Lamination Film", category: "LAMINATION", unitType: "ROLL_LM", rollWidthM: 1.52, averageCostKes: 95, quantityOnHand: 25, lowStockThreshold: 5 },
    { code: "EYELET_STD", name: "Eyelets (silver 40mm)", category: "FINISHING", unitType: "UNIT", averageCostKes: 3.5, quantityOnHand: 500, lowStockThreshold: 100 },
    { code: "HEM_TAPE", name: "Hemming tape", category: "FINISHING", unitType: "ROLL_LM", averageCostKes: 12, quantityOnHand: 100, lowStockThreshold: 20 },
    { code: "ROPE", name: "Rope / bungee", category: "FINISHING", unitType: "ROLL_LM", averageCostKes: 8, quantityOnHand: 50, lowStockThreshold: 10 },
    { code: "POLE_POCKET", name: "Pole pocket webbing", category: "FINISHING", unitType: "ROLL_LM", averageCostKes: 50, quantityOnHand: 30, lowStockThreshold: 5 },
    { code: "PACKAGING_TUBE", name: "Cardboard tube (packaging)", category: "FINISHING", unitType: "UNIT", averageCostKes: 100, quantityOnHand: 0, lowStockThreshold: 0 },
  ];
  for (const s of lfStockItems) {
    await prisma.lFStockItem.upsert({
      where: { code: s.code },
      update: { averageCostKes: s.averageCostKes, quantityOnHand: s.quantityOnHand, lowStockThreshold: s.lowStockThreshold },
      create: {
        code: s.code,
        name: s.name,
        category: s.category,
        unitType: s.unitType,
        rollWidthM: s.rollWidthM ?? undefined,
        quantityOnHand: s.quantityOnHand,
        lowStockThreshold: s.lowStockThreshold,
        costPerUnit: s.averageCostKes,
        averageCostKes: s.averageCostKes,
      },
    });
  }
  console.log("LF stock items seeded");

  // 3D Machine types — doc 2.3
  const machineData = [
    { code: "FDM_STD", name: "FDM (standard)", ratePerHour: 200, sortOrder: 0 },
    { code: "FDM_LG", name: "FDM (large format)", ratePerHour: 300, sortOrder: 1 },
    { code: "RESIN", name: "Resin (MSLA)", ratePerHour: 350, sortOrder: 2 },
    { code: "FDM_MM", name: "Multi-material FDM", ratePerHour: 400, sortOrder: 3 },
  ];
  for (const m of machineData) {
    await prisma.machineType.upsert({
      where: { code: m.code },
      update: { name: m.name, ratePerHour: m.ratePerHour, sortOrder: m.sortOrder },
      create: m,
    });
  }

  // 3D Turnaround — doc 2.8
  const turnaround3D = [
    { code: "STD_3D", name: "Standard (3–7 days)", surchargePercent: 0, serviceType: "THREE_D" },
    { code: "EXPRESS_3D", name: "Express (1–2 days)", surchargePercent: 40, serviceType: "THREE_D" },
    { code: "RUSH_3D", name: "Rush (next day)", surchargePercent: 75, serviceType: "THREE_D" },
    { code: "SAME_DAY_3D", name: "Same day", surchargePercent: 100, serviceType: "THREE_D" },
  ];
  for (let i = 0; i < turnaround3D.length; i++) {
    const t = turnaround3D[i];
    await prisma.turnaroundOption.upsert({
      where: { code: t.code },
      update: { name: t.name, surchargePercent: t.surchargePercent, serviceType: t.serviceType, sortOrder: i },
      create: { ...t, sortOrder: i },
    });
  }

  // 3D Add-ons — doc 2.8 (support removal + finishing)
  const addon3D = [
    { code: "SUP_RM_NONE", name: "No supports / not needed", pricePerUnit: 0, category: "SUPPORT_REMOVAL" },
    { code: "SUP_RM_BASIC", name: "Basic support removal", pricePerUnit: 200, category: "SUPPORT_REMOVAL" },
    { code: "SUP_RM_HEAVY", name: "Heavy support removal + sanding", pricePerUnit: 500, category: "SUPPORT_REMOVAL" },
    { code: "FINISH_RAW", name: "Raw print", pricePerUnit: 0, category: "FINISHING" },
    { code: "SAND_LT", name: "Light sanding", pricePerUnit: 300, category: "FINISHING" },
    { code: "SAND_FULL", name: "Full sanding + primer", pricePerUnit: 700, category: "FINISHING" },
    { code: "PAINT_1", name: "Single colour spray", pricePerUnit: 1000, category: "FINISHING" },
  ];
  for (let i = 0; i < addon3D.length; i++) {
    const a = addon3D[i];
    const existing = await prisma.threeDAddon.findFirst({ where: { code: a.code } });
    if (existing) {
      await prisma.threeDAddon.update({
        where: { id: existing.id },
        data: { name: a.name, pricePerUnit: a.pricePerUnit, category: a.category, sortOrder: i },
      });
    } else {
      await prisma.threeDAddon.create({ data: { ...a, sortOrder: i } });
    }
  }
  console.log("Lamination, finishing, design, turnaround, config, machine, 3D addons seeded");

  // Coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrderAmount: 2000,
      maxUses: 100,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      applicableTo: "ALL",
      applicableIds: [],
    },
  });
  console.log("Seed coupon WELCOME10 created");

  console.log("Seed completed.");
}

main()
  .catch((e: NodeJS.ErrnoException & { code?: string }) => {
    if (e?.code === "ECONNREFUSED" || String(e?.message || e).includes("ECONNREFUSED")) {
      console.error("\n❌ Database connection refused. Check that:");
      console.error("   1. PostgreSQL is running (e.g. brew services start postgresql, or start your DB container)");
      console.error("   2. DATABASE_URL in .env or .env.local is correct (host, port, user, password)");
      console.error("\n   Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/printhub\"\n");
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
