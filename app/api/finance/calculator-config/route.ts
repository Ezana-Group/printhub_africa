import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_LABOUR_RATE = 200;
const DEFAULT_PROFIT_MARGIN = 40;
const DEFAULT_VAT_PCT = 16;
const DEFAULT_MONTHLY_OVERHEAD = 50000;
const DEFAULT_MONTHLY_CAPACITY_HRS = 208; // 26 * 8

/** GET: Public config for 3D (and LF) calculators: business costs + filaments + post-processing fee.
 *  Used by /get-a-quote 3D tab and admin 3D calculator so pricing uses Finance → Business costs.
 */
export async function GET() {
  try {
    const [business, filaments, supportRemovalAddons, finishingAddons] = await Promise.all([
      prisma.lFBusinessSettings.findFirst(),
      prisma.threeDConsumable.findMany({
        where: { kind: "FILAMENT", costPerKgKes: { not: null } },
        orderBy: [{ name: "asc" }, { specification: "asc" }],
      }),
      prisma.threeDAddon.findMany({ where: { category: "SUPPORT_REMOVAL", isActive: true } }),
      prisma.threeDAddon.findMany({ where: { category: "FINISHING", isActive: true } }),
    ]);

    const labourRate = business?.labourRateKesPerHour ?? DEFAULT_LABOUR_RATE;
    const profitMargin = business?.defaultProfitMarginPct ?? DEFAULT_PROFIT_MARGIN;
    const vatPercent = business?.vatRatePct ?? DEFAULT_VAT_PCT;
    const monthlyOverhead =
      (business?.monthlyRentKes ?? 0) +
      (business?.monthlyUtilitiesKes ?? 0) +
      (business?.monthlyInsuranceKes ?? 0) +
      (business?.monthlyOtherKes ?? 0);
    const monthlyCapacityHrs =
      (business?.workingDaysPerMonth ?? 26) * (business?.workingHoursPerDay ?? 8) || DEFAULT_MONTHLY_CAPACITY_HRS;

    const filamentsList = filaments.map((f) => {
      const base = (f.name ?? "").trim();
      const colour = (f.specification ?? "").trim();
      return {
        id: f.id,
        material: base,
        colour: colour || undefined,
        costPerKg: Number(f.costPerKgKes),
        name: colour ? `${base} (${colour})` : base,
      };
    });

    // Post-processing fees from addons (as fallbacks)
    const supportRemovalFee = Number(
      supportRemovalAddons.find((a) => a.code !== "SUP_RM_NONE")?.pricePerUnit ?? 200
    );
    const finishingFee = Number(
      finishingAddons.find((a) => a.code !== "FINISH_RAW")?.pricePerUnit ?? 100
    );

    // Post-processing / support removal fee (from business settings if present, else fallback to addons)
    const postProcessingFeePerUnit = 
      (business as any)?.postProcessingFeePerUnit ?? (supportRemovalFee + finishingFee);

    return NextResponse.json({
      labourRate,
      profitMargin,
      vatPercent,
      monthlyOverhead: monthlyOverhead || DEFAULT_MONTHLY_OVERHEAD,
      monthlyCapacityHrs: monthlyCapacityHrs || DEFAULT_MONTHLY_CAPACITY_HRS,
      filaments: filamentsList,
      postProcessingFeePerUnit,
      // Default extra labor time for post-processing (can be overridden in admin calculator)
      postProcessingTimeHours: 0.5, 
    });
  } catch (e) {
    console.error("calculator-config GET error:", e);
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    const defaultPostProcessingFee = 200 + 100; // support removal + finishing fallback
    return NextResponse.json(
      {
        error: true,
        errorMessage,
        labourRate: DEFAULT_LABOUR_RATE,
        profitMargin: DEFAULT_PROFIT_MARGIN,
        vatPercent: DEFAULT_VAT_PCT,
        monthlyOverhead: DEFAULT_MONTHLY_OVERHEAD,
        monthlyCapacityHrs: DEFAULT_MONTHLY_CAPACITY_HRS,
        filaments: [],
        postProcessingFeePerUnit: defaultPostProcessingFee,
      },
      { status: 500 }
    );
  }
}
