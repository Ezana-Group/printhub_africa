import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { format } from "date-fns";
import { requireRole } from "@/lib/settings-api";

export async function GET(req: NextRequest) {
  // We need an admin api guard here
  // The user should be an ADMIN or SUPER_ADMIN for exporting logs
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  // Ideally, requireAdminApi requires an admin token

  const { searchParams } = new URL(req.url);
  
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const userId = searchParams.get("userId");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const where: Prisma.AuditLogWhereInput = {};

  if (from) {
    where.timestamp = { ...((where.timestamp as any) || {}), gte: new Date(from) };
  }
  if (to) {
    where.timestamp = { ...((where.timestamp as any) || {}), lte: new Date(to) };
  }
  if (userId) {
    where.userId = userId;
  }
  if (category) {
    where.category = category;
  }
  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { targetType: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    include: { user: { select: { name: true, role: true, email: true } } },
    take: 10000, // safety cap
  });

  const parseJsonStr = (val: any) => {
    if (!val) return "";
    try {
      return JSON.stringify(val).replace(/"/g, '""');
    } catch {
      return "";
    }
  };

  const escapeCsv = (val: string | null | undefined) => {
    if (!val) return "";
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  let csv = "ID,Timestamp,Admin Name,Admin Role,Admin Email,Action,Target Type,Target ID,Category,IP Address,Before,After\n";

  for (const log of logs) {
    const ts = format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss");
    const adminParam = escapeCsv(log.user?.name);
    const roleParam = escapeCsv(log.user?.role);
    const emailParam = escapeCsv(log.user?.email);
    const action = escapeCsv(log.action);
    const targetType = escapeCsv(log.targetType || log.entity);
    const targetId = escapeCsv(log.targetId);
    const categoryName = escapeCsv(log.category);
    const ip = escapeCsv(log.ipAddress);
    const before = `"${parseJsonStr(log.before)}"`;
    const after = `"${parseJsonStr(log.after)}"`;

    csv += `${log.id},${ts},${adminParam},${roleParam},${emailParam},${action},${targetType},${targetId},${categoryName},${ip},${before},${after}\n`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv"`,
    },
  });
}
