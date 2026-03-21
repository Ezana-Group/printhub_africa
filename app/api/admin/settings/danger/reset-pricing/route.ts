import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "RESET PRICING");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }

  try {
    // 1. Transaction to clear and re-seed
    await prisma.$transaction([
      prisma.pricingConfig.deleteMany(),
      prisma.printMaterial.deleteMany(),
      prisma.printingMedium.deleteMany(),
      prisma.laminationType.deleteMany(),
      prisma.largeFormatFinishing.deleteMany(),
      prisma.turnaroundOption.deleteMany(),
      prisma.designServiceOption.deleteMany(),

      // Pricing Config
      prisma.pricingConfig.createMany({
        data: [
          { key: "vatRate", valueJson: "0.16" },
          { key: "minOrderLargeFormat", valueJson: "500" },
          { key: "minOrder3D", valueJson: "800" },
          { key: "minAreaSqmLargeFormat", valueJson: "0.5" },
        ],
      }),
      // 3D Print Materials
      prisma.printMaterial.createMany({
        data: [
          { slug: "PLA_STD", name: "PLA (Standard)", type: "PLA", pricePerGram: 0.15, density: 1.24, minChargeGrams: 10, colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"] },
          { slug: "PLA_PLUS", name: "PLA+ (Enhanced)", type: "PLA", pricePerGram: 0.18, density: 1.24, minChargeGrams: 10, colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"] },
          { slug: "PETG", name: "PETG", type: "PETG", pricePerGram: 0.2, density: 1.27, minChargeGrams: 10, colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"] },
          { slug: "ABS", name: "ABS", type: "ABS", pricePerGram: 0.18, density: 1.05, minChargeGrams: 10, colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"] },
          { slug: "TPU", name: "TPU (Flexible)", type: "TPU", pricePerGram: 0.35, density: 1.2, minChargeGrams: 10, colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"] },
          { slug: "RESIN_STD", name: "Resin (Standard)", type: "RESIN", pricePerGram: 0.45, density: 1.1, minChargeGrams: 5, colorOptions: ["Black", "White", "Grey", "Orange", "Blue", "Red"] },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
      }),
      // Printing Mediums (Large Format)
      prisma.printingMedium.createMany({
        data: [
          { slug: "VINYL_IN", name: "Standard Vinyl (Indoor)", pricePerSqMeter: 800, minWidth: 30, maxWidth: 320, sortOrder: 1 },
          { slug: "VINYL_OUT", name: "Standard Vinyl (Outdoor)", pricePerSqMeter: 950, minWidth: 30, maxWidth: 320, sortOrder: 2 },
          { slug: "BACKLIT", name: "Backlit Film", pricePerSqMeter: 1400, minWidth: 30, maxWidth: 320, sortOrder: 3 },
          { slug: "PERF", name: "One-Way Vision / Perforated Vinyl", pricePerSqMeter: 1600, minWidth: 50, maxWidth: 320, sortOrder: 4 },
          { slug: "MESH", name: "Mesh Banner", pricePerSqMeter: 1100, minWidth: 50, maxWidth: 500, sortOrder: 5 },
          { slug: "CANVAS", name: "Canvas (Matte)", pricePerSqMeter: 1800, minWidth: 30, maxWidth: 320, sortOrder: 6 },
          { slug: "FABRIC", name: "Fabric / Textile", pricePerSqMeter: 2200, minWidth: 50, maxWidth: 320, sortOrder: 7 },
          { slug: "FLEX_STD", name: "Flex Banner (Standard)", pricePerSqMeter: 650, minWidth: 50, maxWidth: 500, sortOrder: 8 },
          { slug: "FLEX_PRE", name: "Flex Banner (Premium)", pricePerSqMeter: 900, minWidth: 50, maxWidth: 500, sortOrder: 9 },
          { slug: "CORF", name: "Corflute / Corrugated Plastic", pricePerSqMeter: 1200, minWidth: 30, maxWidth: 150, sortOrder: 10 },
          { slug: "VEH_WRAP", name: "Vehicle Wrap Vinyl", pricePerSqMeter: 2500, minWidth: 50, maxWidth: 160, sortOrder: 13 },
        ],
      }),
      // Lamination
      prisma.laminationType.createMany({
        data: [
          { slug: "NONE", name: "None", pricePerSqm: 0 },
          { slug: "LAM_GLOSS", name: "Gloss Lamination", pricePerSqm: 300 },
          { slug: "LAM_MATTE", name: "Matte Lamination", pricePerSqm: 350 },
        ],
      }),
      // Finishing
      prisma.largeFormatFinishing.createMany({
        data: [
          { code: "NONE", name: "No finishing", pricePerUnit: 0, sortOrder: 0 },
          { code: "EYELET_STD", name: "Eyelets (every 50cm)", pricePerUnit: 150, sortOrder: 1 },
          { code: "HEM_4", name: "Hemming (all 4 sides)", pricePerUnit: 200, sortOrder: 2 },
        ],
      }),
      // Turnaround
      prisma.turnaroundOption.createMany({
        data: [
          { code: "STD", name: "Standard (3–5 days)", surchargePercent: 0, serviceType: "LARGE_FORMAT", sortOrder: 0 },
          { code: "EXPRESS_1", name: "Next day", surchargePercent: 30, serviceType: "LARGE_FORMAT", sortOrder: 1 },
          { code: "STD_3D", name: "Standard (3–7 days)", surchargePercent: 0, serviceType: "THREE_D", sortOrder: 2 },
          { code: "EXPRESS_3D", name: "Express (1–2 days)", surchargePercent: 40, serviceType: "THREE_D", sortOrder: 3 },
        ],
      }),
      // Design Service
      prisma.designServiceOption.createMany({
        data: [
          { code: "NONE", name: "No design", flatFee: 0, sortOrder: 0 },
          { code: "DESIGN_STD", name: "Custom design (standard)", flatFee: 3500, sortOrder: 1 },
        ],
      }),
    ]);

    await writeAudit({ userId: auth.userId, action: "PRICING_RESET", category: "DANGER", request: req });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pricing reset failed:", error);
    return NextResponse.json({ error: "Failed to reset pricing" }, { status: 500 });
  }
}
