import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "RESET COUNTER");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  await prisma.systemSettings.updateMany({
    data: { quoteCounter: 0, updatedAt: new Date() },
  });
  await writeAudit({ userId: auth.userId, action: "QUOTE_COUNTER_RESET", category: "DANGER", request: req });
  return NextResponse.json({ success: true });
}
