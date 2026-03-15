import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRICING_CONFIG = [
  { key: "vatRate", valueJson: "0.16" },
  { key: "minOrderLargeFormat", valueJson: "500" },
  { key: "minOrder3D", valueJson: "800" },
  { key: "minAreaSqmLargeFormat", valueJson: "0.5" },
] as const;

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "RESET PRICING");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  for (const c of DEFAULT_PRICING_CONFIG) {
    await prisma.pricingConfig.upsert({
      where: { key: c.key },
      update: { valueJson: c.valueJson },
      create: c,
    });
  }
  await writeAudit({ userId: auth.userId, action: "PRICING_RESET", category: "DANGER", request: req });
  return NextResponse.json({ success: true });
}
