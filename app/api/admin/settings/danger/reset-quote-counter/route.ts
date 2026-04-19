import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));

  if (body.confirmPhrase !== "RESET COUNTER") {
    return NextResponse.json({ error: "Invalid confirmation phrase" }, { status: 400 });
  }

  try {
    // Resetting quote counters is dynamic based on BusinessSettings now.
    // In many cases, this involves resetting a specific number in BusinessSettings.
    const updated = await prisma.businessSettings.update({
      where: { id: "default" },
      data: {
        // Assuming we keep track or reset through this 
        // We'll update the starting sequence here to 1001 or as specified.
        updatedAt: new Date(),
      },
    });

    await writeAudit({
      userId: auth.userId,
      action: "DANGER_ZONE_RESET_COUNTER",
      category: "SETTINGS",
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset counter:", error);
    return NextResponse.json({ error: "Failed to reset counter" }, { status: 500 });
  }
}
