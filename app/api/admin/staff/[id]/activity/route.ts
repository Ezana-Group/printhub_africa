import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "staff_view" });
  if (auth instanceof NextResponse) return auth;

  const { id: userId } = await params;
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(10, Number(searchParams.get("perPage") ?? 20)));
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = (searchParams.get("type") ?? "").trim();
  const q = (searchParams.get("q") ?? "").trim();

  const where: Prisma.AuditLogWhereInput = { userId };
  if (type) where.entity = type;

  if (from || to) {
    where.timestamp = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        (where.timestamp as Prisma.DateTimeFilter).gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        (where.timestamp as Prisma.DateTimeFilter).lte = toDate;
      }
    }
  }

  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [logs, total, types] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        timestamp: true,
        action: true,
        entity: true,
        entityId: true,
        ipAddress: true,
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where: { userId },
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    })),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    availableTypes: types.map((t) => t.entity).filter(Boolean),
  });
}
