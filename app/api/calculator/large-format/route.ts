import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLargeFormatEstimate } from "@/lib/pricing";
import { getServiceFlags } from "@/lib/service-flags";

/** GET: fetch all options for the large-format calculator (materials, lamination, finishing, design, turnaround) */
export async function GET() {
  try {
    const { largeFormatEnabled } = await getServiceFlags();
    if (!largeFormatEnabled) {
      return NextResponse.json(
        { error: "Large format printing is currently unavailable." },
        { status: 403 }
      );
    }

    const [materials, lamination, finishing, design, turnaround] = await Promise.all([
      prisma.printingMedium.findMany({
        where: { isActive: true, slug: { not: null } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.laminationType.findMany({ orderBy: { id: "asc" } }),
      prisma.largeFormatFinishing.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.designServiceOption.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.turnaroundOption.findMany({
        where: { serviceType: "LARGE_FORMAT", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
    return NextResponse.json({
      materials: materials.map((m) => ({
        id: m.slug,
        slug: m.slug,
        name: m.name,
        pricePerSqm: Number(m.pricePerSqMeter),
        minWidth: m.minWidth,
        maxWidth: m.maxWidth,
      })),
      lamination: lamination.map((l) => ({
        id: l.slug ?? l.id,
        slug: l.slug,
        name: l.name,
        pricePerSqm: Number(l.pricePerSqm),
      })),
      finishing: finishing.map((f) => ({
        code: f.code,
        name: f.name,
        pricePerUnit: Number(f.pricePerUnit),
      })),
      design: design.map((d) => ({
        code: d.code,
        name: d.name,
        flatFee: Number(d.flatFee),
      })),
      turnaround: turnaround.map((t) => ({
        code: t.code,
        name: t.name,
        surchargePercent: Number(t.surchargePercent),
      })),
    });
  } catch (e) {
    console.error("Large format options error:", e);
    return NextResponse.json({ error: "Failed to load options." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { largeFormatEnabled } = await getServiceFlags();
    if (!largeFormatEnabled) {
      return NextResponse.json(
        { error: "Large format printing is currently unavailable." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const widthCm = Number(body.widthCm) || 0;
    const heightCm = Number(body.heightCm) || 0;
    const materialSlug = typeof body.materialSlug === "string" ? body.materialSlug : null;
    const laminationSlug = typeof body.laminationSlug === "string" ? body.laminationSlug : "NONE";
    const finishingCodes = Array.isArray(body.finishingCodes) ? body.finishingCodes : [];
    const designCode = typeof body.designCode === "string" ? body.designCode : "NONE";
    const turnaroundCode = typeof body.turnaroundCode === "string" ? body.turnaroundCode : "STD";
    const quantity = Math.max(1, Math.min(999, Math.floor(Number(body.quantity) || 1)));

    if (!widthCm || !heightCm || !materialSlug) {
      return NextResponse.json(
        { error: "Width, height, and material are required." },
        { status: 400 }
      );
    }

    const [material, lamination, design, turnaround, finishingOptions] = await Promise.all([
      prisma.printingMedium.findFirst({
        where: { slug: materialSlug, isActive: true },
      }),
      prisma.laminationType.findFirst({
        where: { slug: laminationSlug },
      }),
      prisma.designServiceOption.findFirst({
        where: { code: designCode, isActive: true },
      }),
      prisma.turnaroundOption.findFirst({
        where: { code: turnaroundCode, serviceType: "LARGE_FORMAT", isActive: true },
      }),
      prisma.largeFormatFinishing.findMany({
        where: { code: { in: finishingCodes }, isActive: true },
      }),
    ]);

    if (!material) {
      return NextResponse.json(
        { error: "Invalid material." },
        { status: 400 }
      );
    }

    const materialRatePerSqm = Number(material.pricePerSqMeter);
    const laminationRatePerSqm = lamination ? Number(lamination.pricePerSqm) : 0;
    const finishingTotalPerUnit = finishingOptions.reduce((s, f) => s + Number(f.pricePerUnit), 0);
    const designFee = design ? Number(design.flatFee) : 0;
    const rushSurchargePercent = turnaround ? Number(turnaround.surchargePercent) : 0;

    const result = calculateLargeFormatEstimate({
      widthCm,
      heightCm,
      materialRatePerSqm,
      laminationRatePerSqm,
      finishingTotalPerUnit,
      designFee,
      rushSurchargePercent,
      quantity,
    });

    const breakdown = [
      { label: "Base (material)", amount: result.baseCost },
      ...(result.volumeDiscountAmount > 0
        ? [{ label: `Volume discount (${result.volumeDiscountPercent}%)`, amount: -result.volumeDiscountAmount }]
        : []),
      { label: "Lamination", amount: result.laminationCost },
      { label: "Finishing", amount: result.finishingCost },
      { label: "Print subtotal", amount: result.printSubtotal },
      ...(result.rushSurchargeAmount > 0
        ? [{ label: "Rush surcharge", amount: result.rushSurchargeAmount }]
        : []),
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
        disclaimer:
          "This is an estimate only. Your final price will be confirmed by the PrintHub team within 2 business days after reviewing your order details and file. You will not be charged until you accept the confirmed quote.",
      },
    });
  } catch (e) {
    console.error("Large format calculator error:", e);
    return NextResponse.json(
      { error: "Calculation failed. Please check your inputs." },
      { status: 500 }
    );
  }
}
