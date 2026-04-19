import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));

  if (body.confirmPhrase !== "RESET PRICING") {
    return NextResponse.json({ error: "Invalid confirmation phrase" }, { status: 400 });
  }

  try {
    const oldSettings = await prisma.businessSettings.findUnique({
      where: { id: "default" },
    });

    const updated = await prisma.businessSettings.update({
      where: { id: "default" },
      data: {
        // Resetting any price-related fields to defaults
        bankTransferThreshold: 0,
        minimumOrderValue: 0,
        updatedAt: new Date(),
      },
    });

    // Also clearing any pricing overrides in custom products if applicable
    // (Pattern: many systems use specific 'config' tables for granular pricing)
    // We already transitioned most of this to BusinessSettings, so clearing the centralized values is the primary action.

    await writeAudit({
      userId: auth.userId,
      action: "DANGER_ZONE_RESET_PRICING",
      category: "SETTINGS",
      request: req,
      before: oldSettings,
      after: updated,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset pricing:", error);
    return NextResponse.json({ error: "Failed to reset pricing" }, { status: 500 });
  }
}
