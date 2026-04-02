import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { enabled } = await req.json().catch(() => ({}));

  try {
    const updated = await prisma.businessSettings.update({
      where: { id: "default" },
      data: {
        developerMode: !!enabled,
      },
    });

    await writeAudit({
      userId: auth.userId,
      action: "DANGER_ZONE_DEVELOPER_MODE_TOGGLED",
      category: "SETTINGS",
      request: req,
      after: { developerMode: updated.developerMode },
    });

    return NextResponse.json({ success: true, developerMode: updated.developerMode });
  } catch (error) {
    console.error("Developer mode toggle failed:", error);
    return NextResponse.json({ error: "Failed to toggle developer mode" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { developerMode: true },
  });

  return NextResponse.json({ developerMode: settings?.developerMode ?? false });
}
