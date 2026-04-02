import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const sys = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { 
      pendingFactoryReset: true, 
      factoryResetExecuteAt: true, 
      factoryResetInitiatedBy: true 
    },
  });
  if (!sys?.pendingFactoryReset || !sys.factoryResetExecuteAt) {
    return NextResponse.json({ pending: false });
  }
  const now = Date.now();
  const executeAt = sys.factoryResetExecuteAt.getTime();
  return NextResponse.json({
    pending: true,
    executeAt: sys.factoryResetExecuteAt.toISOString(),
    initiatedBy: sys.factoryResetInitiatedBy,
    minutesRemaining: Math.max(0, Math.floor((executeAt - now) / 60000)),
  });
}
