import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { validateDanger } from "@/lib/danger";
import { writeAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    await validateDanger(req, "ANONYMISE");
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Confirmation failed" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id },
    data: {
      name: "[DELETED]",
      email: `deleted-${id}@deleted.invalid`,
      phone: null,
      passwordHash: "[DELETED]",
      isAnonymised: true,
      anonymisedAt: new Date(),
    },
  });
  await prisma.savedAddress.deleteMany({ where: { userId: id } });
  await writeAudit({
    userId: auth.userId,
    action: "CUSTOMER_ANONYMISED",
    category: "DANGER",
    targetId: id,
    request: req,
  });
  return NextResponse.json({ success: true });
}
