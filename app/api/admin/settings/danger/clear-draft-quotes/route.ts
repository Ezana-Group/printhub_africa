import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));

  if (body.confirmPhrase !== "CLEAR DRAFTS") {
    return NextResponse.json({ error: "Invalid confirmation phrase" }, { status: 400 });
  }

  try {
    const deleted = await prisma.quote.deleteMany({
      where: { status: "new" },
    });

    await writeAudit({
      userId: auth.userId,
      action: "DANGER_ZONE_CLEAR_DRAFTS",
      category: "SETTINGS",
      request: req,
      after: { deletedCount: deleted.count },
    });

    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error) {
    console.error("Failed to clear drafts:", error);
    return NextResponse.json({ error: "Failed to clear drafts" }, { status: 500 });
  }
}
