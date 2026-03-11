import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
const HISTORY_KEY = "lfPrintHistory";

/** GET: Profitability breakdown from LF job history (and eventually from completed orders). */
export async function GET(req: Request) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "all"; // all | 30d | 90d
    const config = await prisma.pricingConfig.findUnique({
      where: { key: HISTORY_KEY },
    });
    type Entry = {
      productionCost: number;
      sellingPrice: number;
      profitAmount: number;
      marginPercent: number;
      materialCode: string;
      materialName?: string;
      widthM: number;
      heightM: number;
      quantity: number;
      createdAt: string;
    };
    let list: Entry[] = config?.valueJson ? JSON.parse(config.valueJson) : [];

    const now = new Date();
    if (period === "30d") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      list = list.filter((e) => new Date(e.createdAt) >= cutoff);
    } else if (period === "90d") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 90);
      list = list.filter((e) => new Date(e.createdAt) >= cutoff);
    }

    const totalRevenue = list.reduce((s, e) => s + (e.sellingPrice ?? 0), 0);
    const totalProductionCost = list.reduce((s, e) => s + (e.productionCost ?? 0), 0);
    const totalProfit = list.reduce((s, e) => s + (e.profitAmount ?? 0), 0);
    const averageMarginPct =
      list.length > 0
        ? list.reduce((s, e) => s + (e.marginPercent ?? 0), 0) / list.length
        : 0;

    const byMaterial = new Map<
      string,
      { materialName: string; sqm: number; revenue: number; materialCost: number; profit: number; count: number }
    >();
    for (const e of list) {
      const code = e.materialCode || "OTHER";
      const sqm = (e.widthM || 0) * (e.heightM || 0) * (e.quantity || 1);
      const existing = byMaterial.get(code);
      if (existing) {
        existing.sqm += sqm;
        existing.revenue += e.sellingPrice ?? 0;
        existing.materialCost += e.productionCost ?? 0;
        existing.profit += e.profitAmount ?? 0;
        existing.count += 1;
      } else {
        byMaterial.set(code, {
          materialName: (e as { materialName?: string }).materialName ?? code,
          sqm,
          revenue: e.sellingPrice ?? 0,
          materialCost: e.productionCost ?? 0,
          profit: e.profitAmount ?? 0,
          count: 1,
        });
      }
    }

    const byMaterialList = Array.from(byMaterial.entries()).map(
      ([materialCode, v]) => ({
        materialCode,
        materialName: v.materialName,
        sqmPrinted: Math.round(v.sqm * 100) / 100,
        revenue: Math.round(v.revenue),
        materialCost: Math.round(v.materialCost),
        profit: Math.round(v.profit),
        marginPct: v.revenue > 0 ? Math.round((v.profit / v.revenue) * 10000) / 100 : 0,
        jobCount: v.count,
      })
    );

    const costBreakdownPct = totalProductionCost > 0
      ? {
          productionCost: 100,
          labour: 0,
          machine: 0,
          overhead: 0,
        }
      : { productionCost: 0, labour: 0, machine: 0, overhead: 0 };

    return NextResponse.json({
      period,
      totalRevenue: Math.round(totalRevenue),
      totalProductionCost: Math.round(totalProductionCost),
      totalProfit: Math.round(totalProfit),
      averageMarginPct: Math.round(averageMarginPct * 100) / 100,
      jobCount: list.length,
      byMaterial: byMaterialList,
      costBreakdownPct,
    });
  } catch (e) {
    console.error("LF profitability error:", e);
    return NextResponse.json(
      { error: "Failed to load profitability" },
      { status: 500 }
    );
  }
}
