import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const where: Prisma.AuditLogWhereInput = {};
  const user = searchParams.get("user");
  if (user) where.userId = user;
  const category = searchParams.get("category");
  if (category) where.category = category;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    where.timestamp = {};
    if (from) (where.timestamp as Prisma.DateTimeFilter).gte = new Date(from);
    if (to) (where.timestamp as Prisma.DateTimeFilter).lte = new Date(to);
  }
  const q = searchParams.get("q");
  if (q) {
    where.OR = [
      { details: { contains: q, mode: "insensitive" } },
      { target: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
    ];
  }
  const page = Number(searchParams.get("page") ?? 1);
  const perPage = Number(searchParams.get("perPage") ?? 50);
  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, role: true, email: true } } },
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return NextResponse.json({
    logs,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}
