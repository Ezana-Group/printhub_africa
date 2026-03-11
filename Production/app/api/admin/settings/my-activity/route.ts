import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";

export async function GET(req: Request) {
  const auth = await requireRole(req, "STAFF");
  if (auth instanceof NextResponse) return auth;
  const [events, sessions] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId: auth.userId },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
    prisma.session.findMany({
      where: { userId: auth.userId },
      orderBy: { expires: "desc" },
    }),
  ]);
  return NextResponse.json({ events, sessions });
}
