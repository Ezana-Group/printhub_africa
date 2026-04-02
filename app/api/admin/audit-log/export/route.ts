import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";

/** GET: Export audit logs as CSV. */
export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const q = searchParams.get("q");

    const where: Prisma.AuditLogWhereInput = {};
    if (userId) where.userId = userId;
    
    if (from || to) {
      where.timestamp = {};
      if (from) (where.timestamp as Prisma.DateTimeFilter).gte = new Date(from);
      if (to) (where.timestamp as Prisma.DateTimeFilter).lte = new Date(to);
    }

    if (q) {
      where.OR = [
        { entity: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      take: 10000, 
    });

    const headers = ["Timestamp", "User", "Email", "Action", "Target", "IP Address"];
    const rows = logs.map(log => [
      format(log.timestamp, "yyyy-MM-dd HH:mm:ss"),
      log.user?.name || "System",
      log.user?.email || "N/A",
      log.action,
      `${log.entity}${log.entityId ? " · " + log.entityId : ""}`,
      log.ipAddress || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=audit-log-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`,
      },
    });
  } catch (error) {
    console.error("Audit log export failed:", error);
    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
  }
}
