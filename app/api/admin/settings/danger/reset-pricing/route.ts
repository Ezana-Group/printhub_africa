import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "RESET PRICING");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  // TODO: call seedPricingDefaults() or re-apply pricing seed
  await writeAudit({ userId: auth.userId, action: "PRICING_RESET", category: "DANGER", request: req });
  return NextResponse.json({ success: true });
}
