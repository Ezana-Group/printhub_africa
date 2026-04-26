/**
 * @file prisma/seed.ts
 * ⚠️ WARNING: This seed script is for initial setup and development.
 * DO NOT run this in a production environment after the initial setup as it may 
 * cause data inconsistencies or allow unauthorized access if misconfigured.
 */

if (process.env.PRINTHUB_SEED_ALLOW !== '1') {
  console.error('❌ Dev seed blocked in production.')
  process.exit(1)
}

import path from "node:path";
import { config } from "dotenv";

// Load from project root (seed may run with cwd = prisma/ when using npx prisma db seed)
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient, UserRole, ProductType, PrintMaterialType, PrinterType, CorporateIndustry, CompanySize, CorporateStatus, PaymentTerms, CorporateRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import { assertPrinthubDatabase } from "../lib/db-guard";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  await assertPrinthubDatabase(prisma);

  // 🔴 CRIT-2: Secure Credentials (No hardcoded passwords)
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@printhub.africa";
  let adminRawPassword = process.env.SUPER_ADMIN_PASSWORD;
  let isGenerated = false;

  if (!adminRawPassword && process.env.PRINTHUB_SEED_ALLOW === '1') {
    const crypto = await import("node:crypto");
    adminRawPassword = crypto.randomBytes(12).toString('hex') + "A1!";
    isGenerated = true;
  }

  if (!adminRawPassword) {
    throw new Error("SUPER_ADMIN_PASSWORD must be set in .env for initial seeding.");
  }

  const adminHash = await bcrypt.hash(adminRawPassword, 12);
  const testHash = await bcrypt.hash(process.env.SEED_TEST_PASSWORD || "Test@Temporary123!", 12);

  // Super Admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.SUPER_ADMIN,
      status: "ACTIVE",
      // Only reset password if explicitly requested via env or it's a new user
      ...(process.env.RESET_ADMIN_PASSWORD === '1' && { passwordHash: adminHash })
    },
    create: {
      email: adminEmail,
      name: "PrintHub Super Admin",
      passwordHash: adminHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  if (isGenerated && !existingAdmin) {
    console.log('\n================================================');
    console.log('⚠️  SUPER_ADMIN INITIAL PASSWORD:', adminRawPassword);
    console.log('      PLEASE SAVE THIS PASSWORD IMMEDIATELY!    ');
    console.log('================================================\n');
  } else {
    console.log("Super Admin:", admin.email);
  }

  // Admin (non-super)
  const admin2 = await prisma.user.upsert({
    where: { email: "admin2@printhub.africa" },
    update: {},
    create: {
      email: "admin2@printhub.africa",
      name: "PrintHub Admin",
      passwordHash: testHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("Admin:", admin2.email);

  // Default departments (admin-managed list for staff invite/edit)
  const defaultDepartments = [
    { name: "Management", description: "Directors, managers, and senior leadership", colour: "#0A0A0A", sortOrder: 1 },
    { name: "Production", description: "Print operators, machine operators, 3D print technicians", colour: "#CC3D00", sortOrder: 2 },
    { name: "Design", description: "Graphic designers, pre-press, file preparation", colour: "#7C3AED", sortOrder: 3 },
    { name: "Sales", description: "Sales representatives and account executives", colour: "#059669", sortOrder: 4 },
    { name: "Delivery", description: "Riders, drivers, logistics, and dispatch", colour: "#2563EB", sortOrder: 5 },
    { name: "Finance", description: "Accounting, invoicing, and financial operations", colour: "#D97706", sortOrder: 6 },
    { name: "Customer Support", description: "Customer service and support team", colour: "#DB2777", sortOrder: 7 },
    { name: "IT", description: "Systems, website, and technical operations", colour: "#0891B2", sortOrder: 8 },
  ];
  for (const dept of defaultDepartments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log("Departments seeded:", defaultDepartments.length);

  // Staff – Sales
  const staffSales = await prisma.user.upsert({
    where: { email: "sales@printhub.africa" },
    update: {},
    create: {
      email: "sales@printhub.africa",
      name: "Sales User",
      passwordHash: testHash,
      role: UserRole.STAFF,
      emailVerified: new Date(),
    },
  });
  const salesDept = await prisma.department.findFirst({ where: { name: "Sales" } }).catch(() => null);
  await prisma.staff.upsert({
    where: { userId: staffSales.id },
    update: { department: "Sales", departmentId: salesDept?.id ?? null, position: "Sales Rep" },
    create: {
      userId: staffSales.id,
      department: "Sales",
      departmentId: salesDept?.id ?? null,
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
      passwordHash: testHash,
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
      passwordHash: testHash,
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
      showInNav: true,
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
      showInNav: true,
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
      showInNav: true,
      sortOrder: 1,
    },
  });
  
  // Set showInNav = true on these slugs by default (safe to re-run on existing categories)
  await prisma.category.updateMany({
    where: {
      slug: {
        in: [
          "large-format-printing",
          "3d-printing",
          "stationery-marketing",
          "branded-merchandise",
          "print-on-demand",
          "corporate-b2b"
        ]
      }
    },
    data: { showInNav: true }
  });

  console.log("Categories created & navigation defaults set");

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
      images: ["/images/products/vinyl-banner.webp"],
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
      images: ["/images/products/3d-keyholder.webp"],
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

  // One-time fix: Bambu Lab X1C typical power is ~400W (not 1300W max rated)
  const bambuPrinterUpdated = await prisma.printerAsset.updateMany({
    where: { name: { contains: "Bambu", mode: "insensitive" }, powerWatts: 1300 },
    data: { powerWatts: 400 },
  });
  if (bambuPrinterUpdated.count > 0) console.log("Bambu printer powerWatts corrected to 400W (PrinterAsset)");
  try {
    const bambuHardwareUpdated = await prisma.inventoryHardwareItem.updateMany({
      where: { name: { contains: "Bambu", mode: "insensitive" }, powerWatts: 1300 },
      data: { powerWatts: 400 },
    });
    if (bambuHardwareUpdated.count > 0) console.log("Bambu hardware powerWatts corrected to 400W (InventoryHardwareItem)");
  } catch {
    // ignore if no matching records
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

  // Kenya delivery zones (region-based with county coverage)
  const kenyaZones = [
    {
      name: "Eldoret (Home Base)",
      county: "Uasin Gishu",
      counties: "Uasin Gishu",
      feeKes: 0,
      minDays: 0,
      maxDays: 1,
      sortOrder: 1,
    },
    {
      name: "Nairobi Metro",
      county: "Nairobi",
      counties: "Nairobi, Kiambu, Machakos, Kajiado",
      feeKes: 350,
      minDays: 1,
      maxDays: 2,
      sortOrder: 2,
    },
    {
      name: "Western & Nyanza",
      county: "Kisumu",
      counties: "Kisumu, Kakamega, Bungoma, Busia, Vihiga, Siaya, Homa Bay, Migori, Kisii, Nyamira",
      feeKes: 450,
      minDays: 2,
      maxDays: 3,
      sortOrder: 3,
    },
    {
      name: "Coast Region",
      county: "Mombasa",
      counties: "Mombasa, Kwale, Kilifi, Tana River, Lamu, Taita Taveta",
      feeKes: 600,
      minDays: 3,
      maxDays: 5,
      sortOrder: 4,
    },
    {
      name: "Central & Mount Kenya",
      county: "Nyeri",
      counties: "Nyeri, Kirinyaga, Murang'a, Nyandarua, Meru, Tharaka-Nithi, Embu, Laikipia",
      feeKes: 400,
      minDays: 2,
      maxDays: 3,
      sortOrder: 5,
    },
    {
      name: "Rift Valley (North & South)",
      county: "Nakuru",
      counties: "Nakuru, Kericho, Bomet, Nandi, Trans Nzoia, Elgeyo-Marakwet, West Pokot, Baringo, Samburu, Narok",
      feeKes: 400,
      minDays: 1,
      maxDays: 3,
      sortOrder: 6,
    },
    {
      name: "Northern Kenya (Arid/Remote)",
      county: "Garissa",
      counties: "Garissa, Wajir, Mandera, Marsabit, Isiolo, Turkana",
      feeKes: 1000,
      minDays: 5,
      maxDays: 10,
      sortOrder: 7,
    }
  ];
  for (const z of kenyaZones) {
    const existing = await prisma.deliveryZone.findFirst({
      where: { name: z.name, county: z.county ?? undefined },
    });
    if (!existing) {
      await prisma.deliveryZone.create({
        data: {
          name: z.name,
          county: z.county ?? undefined,
          counties: z.counties ?? undefined,
          feeKes: z.feeKes,
          minDays: z.minDays,
          maxDays: z.maxDays,
          sortOrder: z.sortOrder,
          isActive: true,
        },
      });
    }
  }
  console.log("Kenya delivery zones seeded");

  // Legal pages (full content from legal-content.ts; upsert updates content so re-seed refreshes)
  const { getLegalContent } = await import("./legal-content");
  const legalPages = [
    { slug: "privacy-policy" as const, title: "Privacy Policy" },
    { slug: "data-deletion" as const, title: "Data Deletion Request" },
    { slug: "terms-of-service" as const, title: "Terms of Service" },
    { slug: "refund-policy" as const, title: "Refund and Returns Policy" },
    { slug: "cookie-policy" as const, title: "Cookie Policy" },
    { slug: "account-terms" as const, title: "Account Registration Terms" },
    { slug: "corporate-terms" as const, title: "Corporate Account Terms and Conditions" },
  ];
  for (const page of legalPages) {
    const content = getLegalContent(page.slug);
    await prisma.legalPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content,
        lastUpdated: new Date(),
      },
      create: {
        slug: page.slug,
        title: page.title,
        content,
        lastUpdated: new Date(),
        isPublished: true,
        version: 1,
      },
    });
    console.log(`✓ Seeded: ${page.slug}`);
  }
  console.log("Legal pages seeded");

  // FAQ categories
  const faqCategories = [
    { name: "Ordering & Quotes", slug: "ordering", icon: "ShoppingCart", sortOrder: 1 },
    { name: "Payments", slug: "payments", icon: "CreditCard", sortOrder: 2 },
    { name: "Files & Designs", slug: "files", icon: "FileUp", sortOrder: 3 },
    { name: "Production", slug: "production", icon: "Printer", sortOrder: 4 },
    { name: "Delivery", slug: "delivery", icon: "Truck", sortOrder: 5 },
    { name: "Returns & Refunds", slug: "refunds", icon: "RotateCcw", sortOrder: 6 },
    { name: "3D Printing", slug: "3d", icon: "Box", sortOrder: 7 },
    { name: "Large Format", slug: "lf", icon: "Maximize", sortOrder: 8 },
    { name: "Corporate Accounts", slug: "corporate", icon: "Building2", sortOrder: 9 },
  ];
  for (const cat of faqCategories) {
    await prisma.faqCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
  }
  console.log("FAQ categories seeded");

  // FAQs (need category IDs)
  const orderingCat = await prisma.faqCategory.findUnique({ where: { slug: "ordering" } });
  const paymentsCat = await prisma.faqCategory.findUnique({ where: { slug: "payments" } });
  const filesCat = await prisma.faqCategory.findUnique({ where: { slug: "files" } });
  const deliveryCat = await prisma.faqCategory.findUnique({ where: { slug: "delivery" } });
  const refundsCat = await prisma.faqCategory.findUnique({ where: { slug: "refunds" } });
  const threeDCat = await prisma.faqCategory.findUnique({ where: { slug: "3d" } });
  const lfCat = await prisma.faqCategory.findUnique({ where: { slug: "lf" } });
  const corporateCat = await prisma.faqCategory.findUnique({ where: { slug: "corporate" } });

  const faqs: { categoryId: string; question: string; answer: string; isPopular: boolean; sortOrder: number }[] = [];
  if (orderingCat) {
    faqs.push(
      { categoryId: orderingCat.id, question: "How do I get a quote for large format printing?", answer: '<p>You can get an instant estimate using our <a href="/quote">online quote calculator</a>. Select your material, enter dimensions, quantity and finishing options — you\'ll see a price range immediately. For complex or large jobs, upload your file and our team will confirm the final price within 2 business hours.</p>', isPopular: true, sortOrder: 1 },
      { categoryId: orderingCat.id, question: "How long does it take to get my order?", answer: "<p>Standard turnaround is <strong>2–5 business days</strong> from file approval and payment. Express 24-hour service is available for most items at an additional charge.</p><p>Delivery adds 1–2 days for Eldoret, 2–5 days for other counties.</p>", isPopular: true, sortOrder: 2 },
      { categoryId: orderingCat.id, question: "Can I order in small quantities?", answer: "<p>Yes — our minimum order value is KES 500. There is no minimum quantity for custom prints. We print from 1 piece upwards, though larger quantities reduce your cost per unit.</p>", isPopular: false, sortOrder: 3 },
      { categoryId: orderingCat.id, question: "Do you offer design services?", answer: "<p>Yes. Our design team can create or adapt artwork for your print job. Design fees start from KES 1,500 and are quoted based on complexity. Contact us with your brief for a design quote.</p>", isPopular: false, sortOrder: 4 },
    );
  }
  if (paymentsCat) {
    faqs.push(
      { categoryId: paymentsCat.id, question: "How do I pay?", answer: "<p>We accept:</p><ul><li><strong>M-Pesa</strong> — our Paybill number is shown at checkout</li><li><strong>Visa / Mastercard</strong> — via Pesapal (secure online payment)</li><li><strong>Bank transfer</strong> — for orders above KES 10,000</li></ul><p>Payment is required before production begins.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: paymentsCat.id, question: "Do you offer credit or payment plans?", answer: '<p>Corporate clients with approved accounts can access NET-30 payment terms. <a href="/account/settings/corporate">Apply for a corporate account</a> — approval takes 2 business days.</p><p>We do not currently offer payment plans for individual customers.</p>', isPopular: false, sortOrder: 2 },
      { categoryId: paymentsCat.id, question: "Will I get a VAT invoice?", answer: "<p>Yes. A VAT invoice (16% Kenya VAT) is generated automatically for every order and sent to your email. You can also download invoices from your account at any time. Corporate clients requiring invoices with KRA PIN should ensure their PIN is added to their account profile.</p>", isPopular: false, sortOrder: 3 },
    );
  }
  if (filesCat) {
    faqs.push(
      { categoryId: filesCat.id, question: "What file formats do you accept?", answer: "<p><strong>For large format printing:</strong> AI, PDF (print-ready), PSD, PNG or JPG at 300dpi minimum. Vector files (AI, PDF) are preferred for sharp results.</p><p><strong>For 3D printing:</strong> STL, OBJ, FBX, STEP, 3MF.</p><p>Maximum file size: 500MB per file.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: filesCat.id, question: "My file has low resolution — can you still print it?", answer: "<p>We can print low-resolution files but quality may be affected — particularly for close-up viewing. We review all files before printing and will contact you if we have concerns. For large format prints viewed from a distance, lower resolution is often acceptable.</p>", isPopular: false, sortOrder: 2 },
      { categoryId: filesCat.id, question: "How do I set up my file for printing?", answer: "<p>For best results:</p><ul><li>Set document to actual print size (or scale 1:10 for very large prints)</li><li>Use CMYK colour mode (not RGB)</li><li>Add 3mm bleed on all sides</li><li>Keep text and important elements 5mm from the edge</li><li>Embed or outline all fonts</li><li>Export as print-ready PDF (PDF/X-4 preferred)</li></ul><p>We'll review your file and let you know if anything needs adjustment.</p>", isPopular: false, sortOrder: 3 },
    );
  }
  if (deliveryCat) {
    faqs.push(
      { categoryId: deliveryCat.id, question: "Do you deliver to my county?", answer: "<p>Yes — we deliver to all 47 counties in Kenya. Delivery fees and estimated times vary by location and are calculated at checkout.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: deliveryCat.id, question: "Can I collect my order?", answer: "<p>Yes. Click & Collect is free from our Eldoret location. Select \"Collection\" at checkout. We'll SMS and email you when your order is ready. Collection is available Mon–Fri 8am–6pm, Saturday 9am–3pm.</p>", isPopular: false, sortOrder: 2 },
      { categoryId: deliveryCat.id, question: "How do I track my order?", answer: '<p>Once your order is shipped, you\'ll receive an SMS and email with a tracking link. You can also track at any time at <a href="/track">printhub.africa/track</a> using your order number.</p>', isPopular: true, sortOrder: 3 },
    );
  }
  if (refundsCat) {
    faqs.push(
      { categoryId: refundsCat.id, question: "What if my order is wrong or damaged?", answer: "<p>Contact us within <strong>48 hours of delivery</strong> at support@printhub.africa with photos of the issue and your order number. We'll assess and either reprint or refund — typically resolved within 5 business days.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: refundsCat.id, question: "Can I cancel my order?", answer: "<p>You can cancel before production starts for a full refund (less payment processing fees). Once production has started, a 50% refund applies. Once complete, we cannot cancel. Contact us immediately at support@printhub.africa if you need to cancel.</p>", isPopular: false, sortOrder: 2 },
    );
  }
  if (threeDCat) {
    faqs.push(
      { categoryId: threeDCat.id, question: "What materials can you 3D print in?", answer: "<p>We currently offer: PLA+, PETG, ABS, TPU (flexible), and Standard Resin. Each has different properties — PLA+ is great for general use, PETG is more durable, ABS is heat-resistant, TPU is flexible. Contact us if you need a specific material not listed.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: threeDCat.id, question: "How do I know how much my 3D print will cost?", answer: '<p>Use our <a href="/quote">3D print quote calculator</a>. Enter your estimated weight (grams) and print time (hours) for an instant estimate. Upload your STL file and we\'ll calculate weight and time automatically. Final price is confirmed after our team reviews your file.</p>', isPopular: true, sortOrder: 2 },
      { categoryId: threeDCat.id, question: "What is the maximum build size?", answer: "<p>Our FDM printer (Bambu Lab X1C) has a build volume of 256×256×256mm. For larger objects, we can print in sections and assemble. Contact us to discuss large prints.</p>", isPopular: false, sortOrder: 3 },
    );
  }
  if (lfCat) {
    faqs.push(
      { categoryId: lfCat.id, question: "What is the maximum width you can print?", answer: "<p>Our large format printer handles up to 1.52 metres wide. Length is virtually unlimited (roll-fed). For widths above 1.52m, we can print in panels and join seamlessly.</p>", isPopular: false, sortOrder: 1 },
      { categoryId: lfCat.id, question: "Do you do vehicle wraps?", answer: "<p>Yes. We print full and partial vehicle wraps using premium cast vinyl. Bring your vehicle to our Eldoret location for installation. Contact us for a vehicle wrap quote — we'll need photos and your vehicle make/model.</p>", isPopular: true, sortOrder: 2 },
    );
  }
  if (corporateCat) {
    faqs.push(
      { categoryId: corporateCat.id, question: "How do I apply for a corporate account?", answer: '<p>Go to <a href="/account/settings/corporate">Account → Corporate Account</a> and submit your company details and KRA PIN. We review applications within 2 business days. Approved accounts get NET-30 payment terms.</p>', isPopular: true, sortOrder: 1 },
    );
  }

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { categoryId: faq.categoryId, question: faq.question },
    });
    if (!existing) {
      await prisma.faq.create({
        data: { ...faq, isActive: true },
      });
    }
  }
  console.log("FAQs seeded");

  // Careers — sample job listings
  const jobListings = [
    {
      title: "Print Technician (Large Format)",
      slug: "print-technician-large-format",
      department: "Production",
      type: "FULL_TIME" as const,
      location: "Eldoret, Kenya",
      isRemote: false,
      description:
        "Join our production team to operate and maintain our large format printers. You'll work with Roland and Mimaki equipment, prepare substrates, and ensure quality output. Full training provided for the right candidate.",
      responsibilities:
        "• Operate large format printers (Roland, Mimaki)\n• Prepare and load substrates\n• Perform quality checks\n• Basic maintenance and troubleshooting\n• Meet production deadlines",
      requirements:
        "• Keen attention to detail\n• Ability to follow SOPs\n• Physical ability to handle rolls and sheets\n• Basic numeracy and record-keeping",
      niceToHave: "Previous experience in print or signage. Familiarity with RIP software.",
      benefits: ["Medical cover", "Pension", "Transport allowance", "Training"],
      status: "PUBLISHED",
      isFeatured: true,
      sortOrder: 0,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Sales Representative",
      slug: "sales-representative",
      department: "Sales",
      type: "FULL_TIME" as const,
      location: "Eldoret, Kenya",
      isRemote: false,
      description:
        "We're looking for a sales representative to grow our B2B and walk-in client base. You'll handle quotes, follow-ups, and customer relationships for large format and 3D print jobs.",
      responsibilities:
        "• Respond to quote requests and prepare proposals\n• Follow up with leads and existing clients\n• Achieve monthly sales targets\n• Maintain CRM and order pipeline",
      requirements:
        "• 1+ years in sales or customer-facing role\n• Good communication in English (and Swahili a plus)\n• Comfort with numbers and basic pricing",
      niceToHave: "Experience in print, advertising, or creative services.",
      benefits: ["Medical cover", "Performance bonus", "Transport allowance"],
      status: "PUBLISHED",
      isFeatured: false,
      sortOrder: 1,
      applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  ];
  for (const job of jobListings) {
    const existing = await prisma.jobListing.findUnique({ where: { slug: job.slug } });
    if (!existing) {
      await prisma.jobListing.create({
        data: {
          ...job,
          status: job.status as "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "FILLED",
          publishedAt: job.status === "PUBLISHED" ? new Date() : null,
        },
      });
    }
  }
  console.log("Careers job listings seeded");

  // Settings defaults (SEO, Loyalty, Referral, Discounts, System, Business, Shipping)
  const defaultBonusRules = [
    { id: "first_order", name: "First order bonus", type: "FIXED_POINTS", value: 50, enabled: true },
    { id: "birthday", name: "Birthday month multiplier", type: "MULTIPLIER", value: 2, enabled: true },
    { id: "review", name: "Approved review", type: "FIXED_POINTS", value: 20, enabled: true },
    { id: "referral_referee", name: "Referred friend's 1st order", type: "FIXED_POINTS", value: 100, enabled: true },
    { id: "referral_referrer", name: "Successful referral", type: "FIXED_POINTS", value: 50, enabled: true },
  ];
  const defaultTiers = [
    { name: "Bronze", minPoints: 0, maxPoints: 999, earnMultiplier: 1, perks: [] },
    { name: "Silver", minPoints: 1000, maxPoints: 4999, earnMultiplier: 1.25, perks: [] },
    { name: "Gold", minPoints: 5000, maxPoints: 19999, earnMultiplier: 1.5, perks: ["Free standard delivery"] },
    { name: "Platinum", minPoints: 20000, maxPoints: null, earnMultiplier: 2, perks: ["Free express delivery", "Priority queue"] },
  ];
  const defaultVolumeTiers = [
    { minQty: 2, maxQty: 4, discountPct: 5 },
    { minQty: 5, maxQty: 9, discountPct: 10 },
    { minQty: 10, maxQty: 19, discountPct: 15 },
    { minQty: 20, maxQty: 49, discountPct: 20 },
    { minQty: 50, maxQty: null, discountPct: 25 },
  ];

  const settingsToSeed = [
    ["seoSettings", { id: "default" }],
    ["loyaltySettings", { id: "default", bonusRules: defaultBonusRules, tiers: defaultTiers }],
    ["referralSettings", { id: "default" }],
    ["discountSettings", { id: "default", volumeDiscountTiers: defaultVolumeTiers }],
    ["systemSettings", { id: "default" }],
    ["businessSettings", { id: "default" }],
    ["shippingSettings", { id: "default" }],
  ] as const;
  for (const [model, data] of settingsToSeed) {
    await (prisma as unknown as Record<string, { upsert: (arg: { where: { id: string }; update: object; create: object }) => Promise<unknown> }>)[model].upsert({
      where: { id: "default" },
      update: {},
      create: data as object,
    });
  }
  console.log("Settings defaults (SEO, Loyalty, Referral, Discounts, System, Business, Shipping) seeded");

  // Print-on-Demand Catalogue categories
  const catalogueCategories = [
    { name: "Home Décor", slug: "home-decor", icon: "home", sortOrder: 1 },
    { name: "Phone & Tech", slug: "phone-tech", icon: "smartphone", sortOrder: 2 },
    { name: "Jewellery & Wearables", slug: "jewellery", icon: "gem", sortOrder: 3 },
    { name: "Toys & Games", slug: "toys-games", icon: "gamepad-2", sortOrder: 4 },
    { name: "Tools & Organisers", slug: "tools", icon: "wrench", sortOrder: 5 },
    { name: "Architecture & Models", slug: "architecture", icon: "building-2", sortOrder: 6 },
    { name: "Education & STEM", slug: "education", icon: "graduation-cap", sortOrder: 7 },
    { name: "Fashion Accessories", slug: "fashion", icon: "scissors", sortOrder: 8 },
    { name: "Office & Desk", slug: "office-desk", icon: "monitor", sortOrder: 9 },
    { name: "Kenya Collection", slug: "kenya-collection", icon: "map-pin", sortOrder: 10 },
  ];
  for (const cat of catalogueCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, isActive: true },
    });
  }
  console.log("Catalogue categories seeded");

  // Corporate portal counters (for CORP-001, CINV-2026-0001)
  await prisma.counter.upsert({
    where: { id: "corporate_account" },
    update: {},
    create: { id: "corporate_account", value: 0 },
  });
  await prisma.counter.upsert({
    where: { id: "corporate_invoice" },
    update: {},
    create: { id: "corporate_invoice", value: 0 },
  });
  console.log("Corporate counters seeded");

  // Corporate test account — approved account for review and testing (Account → Corporate, NET-30, place orders)
  const corporateUser = await prisma.user.upsert({
    where: { email: "corporate@printhub.africa" },
    update: {},
    create: {
      email: "corporate@printhub.africa",
      name: "Corporate Test Contact",
      passwordHash: testHash,
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });
  const existingCorp = await prisma.corporateAccount.findFirst({
    where: { primaryUserId: corporateUser.id },
  });
  if (!existingCorp) {
    const corp = await prisma.corporateAccount.create({
      data: {
        accountNumber: "CORP-001",
        companyName: "PrintHub Test Company Ltd",
        tradingName: "Test Corp",
        kraPin: "P051V123456X",
        industry: CorporateIndustry.TECHNOLOGY,
        companySize: CompanySize.SMALL,
        primaryUserId: corporateUser.id,
        billingAddress: "123 Test Street",
        billingCity: "Eldoret",
        billingCounty: "Uasin Gishu",
        paymentTerms: PaymentTerms.NET_30,
        creditLimit: 100000,
        status: CorporateStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: admin.id,
      },
    });
    await prisma.corporateTeamMember.create({
      data: {
        corporateId: corp.id,
        userId: corporateUser.id,
        role: CorporateRole.OWNER,
        jobTitle: "Primary Contact",
        canPlaceOrders: true,
        canViewInvoices: true,
        canManageTeam: true,
        isActive: true,
        acceptedAt: new Date(),
      },
    });
    await prisma.counter.update({
      where: { id: "corporate_account" },
      data: { value: 1 },
    });
  }
  console.log("Corporate test account: corporate@printhub.africa (approved, CORP-001)");

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
