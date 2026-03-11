import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import type { Prisma } from "@prisma/client";

function buildWhere(searchParams: URLSearchParams): Prisma.AuditLogWhereInput {
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
  return where;
}

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const logs = await prisma.auditLog.findMany({
    where: buildWhere(searchParams),
    include: { user: { select: { name: true, role: true } } },
    orderBy: { timestamp: "desc" },
  });
  const csv = [
    ["Timestamp", "User", "Role", "Category", "Action", "Target", "Details", "IP"].join(","),
    ...logs.map((l) =>
      [
        l.timestamp.toISOString(),
        l.user?.name ?? "System",
        l.user?.role ?? "—",
        l.category ?? "—",
        l.action,
        l.target ?? "—",
        `"${(l.details ?? "").replace(/"/g, '""')}"`,
        l.ipAddress ?? "—",
      ].join(",")
    ),
  ].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-${Date.now()}.csv"`,
    },
  });
}
