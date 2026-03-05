import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculate3DEstimate,
  applyMinOrder,
  roundToNearest10,
  VAT_RATE,
  SUPPORT_MULT,
  type ThreeDEstimateInput,
} from "@/lib/pricing";

const DEFAULT_FILAMENT_DENSITY = 1.24;
const DEFAULT_MIN_CHARGE_GRAMS = 10;

/** GET: fetch all options for the 3D calculator. Materials from Inventory → 3D printing → Filament (cost per kg → price per gram). */
export async function GET() {
  try {
    const [filaments, machines, turnaround, supportRemoval, finishing] = await Promise.all([
      prisma.threeDConsumable.findMany({
        where: { kind: "FILAMENT", costPerKgKes: { not: null } },
        orderBy: [{ name: "asc" }, { specification: "asc" }],
      }),
      prisma.machineType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.turnaroundOption.findMany({
        where: { serviceType: "THREE_D", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.threeDAddon.findMany({
        where: { category: "SUPPORT_REMOVAL", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.threeDAddon.findMany({
        where: { category: "FINISHING", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({
      materials: filaments.map((m) => {
        const costPerKg = Number(m.costPerKgKes);
        const name = m.specification ? `${m.name} (${m.specification})` : m.name;
        return {
          id: m.id,
          slug: m.id,
          name,
          type: "FILAMENT",
          pricePerGram: costPerKg / 1000,
          density: DEFAULT_FILAMENT_DENSITY,
          minChargeGrams: DEFAULT_MIN_CHARGE_GRAMS,
          colorOptions: [] as string[],
        };
      }),
      machines: machines.map((m) => ({
        code: m.code,
        name: m.name,
        ratePerHour: Number(m.ratePerHour),
      })),
      turnaround: turnaround.map((t) => ({
        code: t.code,
        name: t.name,
        surchargePercent: Number(t.surchargePercent),
      })),
      supportRemoval: supportRemoval.map((a) => ({
        code: a.code,
        name: a.name,
        pricePerUnit: Number(a.pricePerUnit),
      })),
      finishing: finishing.map((a) => ({
        code: a.code,
        name: a.name,
        pricePerUnit: Number(a.pricePerUnit),
      })),
    });
  } catch (e) {
    console.error("3D options error:", e);
    return NextResponse.json({ error: "Failed to load options." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const materialSlug = typeof body.materialSlug === "string" ? body.materialSlug : "";
    const quantity = Math.max(1, Math.min(999, Math.floor(Number(body.quantity) || 1)));
    const designFee = Number(body.designFee) || 0;

    // Simple mode: direct weight (g) + print time (hrs) — like the reference calculator
    const weightG = Number(body.weightG) || 0;
    const printTimeHrs = Number(body.printTimeHrs) || 0;
    const useSimpleMode = weightG > 0 && printTimeHrs > 0 && materialSlug;

    if (useSimpleMode) {
      const filament = await prisma.threeDConsumable.findFirst({
        where: { id: materialSlug, kind: "FILAMENT", costPerKgKes: { not: null } },
      });
      const [machine, turnaround, supportRemovalAddons, finishingAddons] = await Promise.all([
        prisma.machineType.findFirst({ where: { code: body.machineCode || "FDM_STD", isActive: true } }),
        prisma.turnaroundOption.findFirst({ where: { code: body.turnaroundCode || "STD_3D", serviceType: "THREE_D", isActive: true } }),
        prisma.threeDAddon.findMany({ where: { category: "SUPPORT_REMOVAL", isActive: true } }),
        prisma.threeDAddon.findMany({ where: { category: "FINISHING", isActive: true } }),
      ]);
      if (!filament) return NextResponse.json({ error: "Invalid material." }, { status: 400 });
      const pricePerGram = Number(filament.costPerKgKes) / 1000;
      const machineRate = machine ? Number(machine.ratePerHour) : 200;
      const rushPercent = turnaround ? Number(turnaround.surchargePercent) : 0;
      const postProcessing = body.postProcessing === true;
      const supportRemovalFee = postProcessing
        ? Number(supportRemovalAddons.find((a) => a.code !== "SUP_RM_NONE")?.pricePerUnit ?? 50) : 0;
      const finishingFee = postProcessing
        ? Number(finishingAddons.find((a) => a.code !== "FINISH_RAW")?.pricePerUnit ?? 100) : 0;

      const materialCost = weightG * pricePerGram * quantity;
      const machineTimeCost = printTimeHrs * machineRate * quantity;
      const postProcessingCost = (supportRemovalFee + finishingFee) * quantity;
      const printSubtotal = materialCost + machineTimeCost + postProcessingCost;
      const rushSurchargeAmount = printSubtotal * (rushPercent / 100);
      const subtotalExVat = printSubtotal + rushSurchargeAmount + designFee;
      const vat = subtotalExVat * VAT_RATE;
      const totalEstimate = subtotalExVat + vat;
      const totalRounded = roundToNearest10(totalEstimate);
      const totalFinal = applyMinOrder(totalRounded, "3d");
      const estimateRangeLow = roundToNearest10(totalFinal * 0.85);
      const estimateRangeHigh = roundToNearest10(totalFinal * 1.25);

      const breakdown = [
        { label: "Material", amount: materialCost },
        { label: "Machine time", amount: machineTimeCost },
        { label: "Post-processing", amount: postProcessingCost },
        { label: "Print subtotal", amount: printSubtotal },
        ...(rushSurchargeAmount > 0 ? [{ label: "Rush surcharge", amount: rushSurchargeAmount }] : []),
        ...(designFee > 0 ? [{ label: "Design fee", amount: designFee }] : []),
        { label: "Subtotal (ex VAT)", amount: subtotalExVat },
        { label: "VAT (16%)", amount: vat },
        { label: "Total estimate", amount: totalFinal },
      ];

      return NextResponse.json({
        success: true,
        estimate: {
          adjWeightG: weightG,
          adjPrintTimeHrs: printTimeHrs,
          materialCost,
          machineTimeCost,
          postProcessingCost,
          printSubtotal,
          rushSurchargeAmount,
          designFee,
          subtotalExVat,
          vat,
          totalFinal,
          estimateRangeLow,
          estimateRangeHigh,
          breakdown,
          disclaimer:
            "This is an estimate. Our team will slice your file and send a confirmed quote within 2 business days.",
        },
      });
    }

    // Dimension-based mode
    const lengthMm = Number(body.lengthMm) || 0;
    const widthMm = Number(body.widthMm) || 0;
    const heightMm = Number(body.heightMm) || 0;
    const shapeComplexity = (body.shapeComplexity as keyof typeof SUPPORT_MULT) || "moderate";
    const machineCode = typeof body.machineCode === "string" ? body.machineCode : "FDM_STD";
    const infillPercent = Math.min(100, Math.max(10, Number(body.infillPercent) || 20));
    const layerHeightMm = Number(body.layerHeightMm) || 0.2;
    const supportCode = (body.supportCode as keyof typeof SUPPORT_MULT) || "NONE";
    const supportRemovalCode = typeof body.supportRemovalCode === "string" ? body.supportRemovalCode : "SUP_RM_NONE";
    const finishingCode = typeof body.finishingCode === "string" ? body.finishingCode : "FINISH_RAW";
    const turnaroundCode = typeof body.turnaroundCode === "string" ? body.turnaroundCode : "STD_3D";

    if (!lengthMm || !widthMm || !heightMm || !materialSlug) {
      return NextResponse.json(
        { error: "Dimensions and material are required (or use weight + print time)." },
        { status: 400 }
      );
    }

    const [filament, machine, turnaround, supportRemovalAddons, finishingAddons] = await Promise.all([
      prisma.threeDConsumable.findFirst({
        where: { id: materialSlug, kind: "FILAMENT", costPerKgKes: { not: null } },
      }),
      prisma.machineType.findFirst({
        where: { code: machineCode, isActive: true },
      }),
      prisma.turnaroundOption.findFirst({
        where: { code: turnaroundCode, serviceType: "THREE_D", isActive: true },
      }),
      prisma.threeDAddon.findMany({
        where: { category: "SUPPORT_REMOVAL", isActive: true },
      }),
      prisma.threeDAddon.findMany({
        where: { category: "FINISHING", isActive: true },
      }),
    ]);

    if (!filament) {
      return NextResponse.json({ error: "Invalid material." }, { status: 400 });
    }

    const machineRate = machine ? Number(machine.ratePerHour) : 200;
    const rushPercent = turnaround ? Number(turnaround.surchargePercent) : 0;
    const supportRemovalFee = supportRemovalAddons.find((a) => a.code === supportRemovalCode)?.pricePerUnit ?? 0;
    const finishingFee = finishingAddons.find((a) => a.code === finishingCode)?.pricePerUnit ?? 0;

    const validShape = ["simple", "moderate", "complex", "dense"].includes(shapeComplexity)
      ? shapeComplexity
      : "moderate";

    const materialRatePerGram = Number(filament.costPerKgKes) / 1000;

    const input: ThreeDEstimateInput = {
      lengthMm,
      widthMm,
      heightMm,
      shapeComplexity: validShape as "simple" | "moderate" | "complex" | "dense",
      materialSlug,
      materialRatePerGram,
      materialDensity: DEFAULT_FILAMENT_DENSITY,
      minChargeGrams: DEFAULT_MIN_CHARGE_GRAMS,
      machineRatePerHour: machineRate,
      infillPercent,
      layerHeightMm,
      supportCode: supportCode in SUPPORT_MULT ? (supportCode as keyof typeof SUPPORT_MULT) : "NONE",
      supportRemovalFee: Number(supportRemovalFee),
      finishingFee: Number(finishingFee),
      rushSurchargePercent: rushPercent,
      designFee,
      quantity,
    };

    const result = calculate3DEstimate(input);

    const breakdown = [
      { label: "Material", amount: result.materialCost },
      { label: "Machine time", amount: result.machineTimeCost },
      { label: "Post-processing", amount: result.postProcessingCost },
      { label: "Print subtotal", amount: result.printSubtotal },
      ...(result.rushSurchargeAmount > 0 ? [{ label: "Rush surcharge", amount: result.rushSurchargeAmount }] : []),
      ...(result.designFee > 0 ? [{ label: "Design fee", amount: result.designFee }] : []),
      { label: "Subtotal (ex VAT)", amount: result.subtotalExVat },
      { label: "VAT (16%)", amount: result.vat },
      { label: "Total estimate", amount: result.totalFinal },
    ];

    return NextResponse.json({
      success: true,
      estimate: {
        ...result,
        breakdown,
        estimatedWeightG: result.adjWeightG,
        estimatedTimeHrs: result.adjPrintTimeHrs,
        disclaimer:
          "This is an estimate based on your inputs. Our team will slice your file and send a confirmed quote within 2 business days. You will not be charged until you accept the confirmed quote.",
      },
    });
  } catch (e) {
    console.error("3D calculator error:", e);
    return NextResponse.json(
      { error: "Calculation failed. Please check your inputs." },
      { status: 500 }
    );
  }
}
