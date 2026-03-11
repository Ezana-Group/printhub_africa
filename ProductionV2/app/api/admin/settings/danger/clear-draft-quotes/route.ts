import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  try {
    await validateDanger(req, "CLEAR DRAFTS");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  const { count } = await prisma.quote.deleteMany({ where: { status: "new" } });
  await writeAudit({
    userId: auth.userId,
    action: "DRAFT_QUOTES_CLEARED",
    category: "DANGER",
    details: `Deleted ${count} draft quotes`,
    request: req,
  });
  return NextResponse.json({ success: true, deleted: count });
}
