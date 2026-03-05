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
      const data = {
        labourRateKesPerHour: business.labourRateKesPerHour ?? row?.labourRateKesPerHour ?? 200,
        finishingTimeEyeletStd: business.finishingTimeEyeletStd ?? row?.finishingTimeEyeletStd ?? 0.1,
        finishingTimeEyeletHeavy: business.finishingTimeEyeletHeavy ?? row?.finishingTimeEyeletHeavy ?? 0.2,
        finishingTimeHemAll4: business.finishingTimeHemAll4 ?? row?.finishingTimeHemAll4 ?? 0.25,
        finishingTimeHemTop2: business.finishingTimeHemTop2 ?? row?.finishingTimeHemTop2 ?? 0.15,
        finishingTimePole: business.finishingTimePole ?? row?.finishingTimePole ?? 0.2,
        finishingTimeRope: business.finishingTimeRope ?? row?.finishingTimeRope ?? 0.1,
        monthlyRentKes: business.monthlyRentKes ?? row?.monthlyRentKes ?? 35000,
        monthlyUtilitiesKes: business.monthlyUtilitiesKes ?? row?.monthlyUtilitiesKes ?? 8000,
        monthlyInsuranceKes: business.monthlyInsuranceKes ?? row?.monthlyInsuranceKes ?? 4000,
        monthlyOtherKes: business.monthlyOtherKes ?? row?.monthlyOtherKes ?? 3000,
        workingDaysPerMonth: business.workingDaysPerMonth ?? row?.workingDaysPerMonth ?? 26,
        workingHoursPerDay: business.workingHoursPerDay ?? row?.workingHoursPerDay ?? 8,
        wastageBufferPercent: business.wastageBufferPercent ?? row?.wastageBufferPercent ?? 3,
        substrateWasteFactor: business.substrateWasteFactor ?? row?.substrateWasteFactor ?? 1.05,
        rigidSheetWasteFactor: business.rigidSheetWasteFactor ?? row?.rigidSheetWasteFactor ?? 1.1,
        defaultProfitMarginPct: business.defaultProfitMarginPct ?? row?.defaultProfitMarginPct ?? 40,
        vatRatePct: business.vatRatePct ?? row?.vatRatePct ?? 16,
        minOrderValueKes: business.minOrderValueKes ?? row?.minOrderValueKes ?? 500,
      };
      if (row) {
        await prisma.lFBusinessSettings.update({
          where: { id: row.id },
          data,
        });
      } else {
        await prisma.lFBusinessSettings.create({ data });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("LF settings PATCH error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
