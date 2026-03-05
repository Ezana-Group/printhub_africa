import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

/** GET: Return current LF printer (default) and business settings */
export async function GET() {
  const auth = await requireAdminApi({ finance: true, needEdit: false });
  if (auth instanceof NextResponse) return auth;
  try {
    const [printer, business] = await Promise.all([
      prisma.lFPrinterSettings.findFirst({ where: { isDefault: true } }),
      prisma.lFBusinessSettings.findFirst(),
    ]);
    return NextResponse.json({ printer, business });
  } catch (e) {
    console.error("LF settings GET error:", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

/** PATCH: Update LF printer and/or business settings */
export async function PATCH(req: Request) {
  const auth = await requireAdminApi({ finance: true, needEdit: true });
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { printer, business } = body;

    if (printer && typeof printer === "object") {
      const row = await prisma.lFPrinterSettings.findFirst({ where: { isDefault: true } });
      if (row) {
        await prisma.lFPrinterSettings.update({
          where: { id: row.id },
          data: {
            name: printer.name ?? row.name,
            model: printer.model ?? row.model,
            maxPrintWidthM: printer.maxPrintWidthM ?? row.maxPrintWidthM,
            printSpeedSqmPerHour: printer.printSpeedSqmPerHour ?? row.printSpeedSqmPerHour,
            setupTimeHours: printer.setupTimeHours ?? row.setupTimeHours,
            purchasePriceKes: printer.purchasePriceKes ?? row.purchasePriceKes,
            lifespanHours: printer.lifespanHours ?? row.lifespanHours,
            annualMaintenanceKes: printer.annualMaintenanceKes ?? row.annualMaintenanceKes,
            powerWatts: printer.powerWatts ?? row.powerWatts,
            electricityRateKesKwh: printer.electricityRateKesKwh ?? row.electricityRateKesKwh,
            inkChannelSettings: printer.inkChannelSettings ?? row.inkChannelSettings,
          },
        });
      }
    }

    if (business && typeof business === "object") {
      const row = await prisma.lFBusinessSettings.findFirst();
      if (row) {
        await prisma.lFBusinessSettings.update({
          where: { id: row.id },
          data: {
            labourRateKesPerHour: business.labourRateKesPerHour ?? row.labourRateKesPerHour,
            finishingTimeEyeletStd: business.finishingTimeEyeletStd ?? row.finishingTimeEyeletStd,
            finishingTimeEyeletHeavy: business.finishingTimeEyeletHeavy ?? row.finishingTimeEyeletHeavy,
            finishingTimeHemAll4: business.finishingTimeHemAll4 ?? row.finishingTimeHemAll4,
            finishingTimeHemTop2: business.finishingTimeHemTop2 ?? row.finishingTimeHemTop2,
            finishingTimePole: business.finishingTimePole ?? row.finishingTimePole,
            finishingTimeRope: business.finishingTimeRope ?? row.finishingTimeRope,
            monthlyRentKes: business.monthlyRentKes ?? row.monthlyRentKes,
            monthlyUtilitiesKes: business.monthlyUtilitiesKes ?? row.monthlyUtilitiesKes,
            monthlyInsuranceKes: business.monthlyInsuranceKes ?? row.monthlyInsuranceKes,
            monthlyOtherKes: business.monthlyOtherKes ?? row.monthlyOtherKes,
            workingDaysPerMonth: business.workingDaysPerMonth ?? row.workingDaysPerMonth,
            workingHoursPerDay: business.workingHoursPerDay ?? row.workingHoursPerDay,
            wastageBufferPercent: business.wastageBufferPercent ?? row.wastageBufferPercent,
            substrateWasteFactor: business.substrateWasteFactor ?? row.substrateWasteFactor,
            rigidSheetWasteFactor: business.rigidSheetWasteFactor ?? row.rigidSheetWasteFactor,
            defaultProfitMarginPct: business.defaultProfitMarginPct ?? row.defaultProfitMarginPct,
            vatRatePct: business.vatRatePct ?? row.vatRatePct,
            minOrderValueKes: business.minOrderValueKes ?? row.minOrderValueKes,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("LF settings PATCH error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
