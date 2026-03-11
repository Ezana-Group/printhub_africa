import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: {
      pendingFactoryReset: false,
      factoryResetExecuteAt: null,
      factoryResetInitiatedBy: null,
      updatedAt: new Date(),
    },
    create: { id: "default" },
  });
  await writeAudit({ userId: auth.userId, action: "FACTORY_RESET_CANCELLED", category: "DANGER", request: req });
  return NextResponse.json({ success: true });
}
