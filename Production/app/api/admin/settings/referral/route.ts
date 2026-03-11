import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const s = await prisma.referralSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => ({}));
  const rest = { ...body };
  delete (rest as Record<string, unknown>).updatedAt;
  await prisma.referralSettings.update({
    where: { id: "default" },
    data: { ...rest, updatedAt: new Date() },
  });
  await writeAudit({
    userId: auth.userId,
    action: "REFERRAL_SETTINGS_UPDATED",
    category: "SETTINGS",
    request: req,
  });
  return NextResponse.json({ success: true });
}
