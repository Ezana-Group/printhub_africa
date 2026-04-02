import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchFilters } from "./search-filters";
import { JsonViewer } from "./json-viewer";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Audit Logs - PrintHub Admin",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    from?: string;
    to?: string;
    userId?: string;
    category?: string;
    q?: string;
  }>;
}) {
  // Using next-auth getServerSession directly since requireRole takes Request
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
    redirect("/login");
  }

  const queryParams = await searchParams;
  const page = parseInt(queryParams.page ?? "1", 10) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};

  if (queryParams.from) {
    where.timestamp = { ...((where.timestamp as any) || {}), gte: new Date(queryParams.from) };
  }
  if (queryParams.to) {
    where.timestamp = { ...((where.timestamp as any) || {}), lte: new Date(queryParams.to) };
  }
  if (queryParams.userId) {
    where.userId = queryParams.userId;
  }
  if (queryParams.category) {
    where.category = queryParams.category;
  }
  if (queryParams.q) {
    where.OR = [
      { action: { contains: queryParams.q, mode: "insensitive" } },
      { entity: { contains: queryParams.q, mode: "insensitive" } },
      { targetType: { contains: queryParams.q, mode: "insensitive" } },
      { targetId: { contains: queryParams.q, mode: "insensitive" } },
    ];
  }

  const [totalItems, logs, allStaff] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN", "STAFF"] } },
      select: { id: true, name: true, role: true },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <a 
          href={`/api/admin/audit-log/export?${new URLSearchParams(queryParams as any).toString()}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors"
          download
        >
          Export CSV
        </a>
      </div>

      <SearchFilters 
        initialFilters={queryParams} 
        staff={allStaff.map(s => ({ id: s.id, name: s.name || 'Unknown', role: s.role }))} 
      />

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user.name ?? 'Unknown'}</span>
                          <span className="text-[10px] uppercase text-muted-foreground">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-semibold tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.targetType || log.entity}</span>
                        {log.targetId && <span className="text-xs text-muted-foreground mt-0.5 font-mono">{log.targetId}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <JsonViewer data={log.after || log.before} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination logic here */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {skip + 1} to {Math.min(skip + limit, totalItems)} of {totalItems}
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-1">
              {page > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...queryParams, page: String(page - 1) }).toString()}`}
                  className="px-3 py-1 text-sm rounded hover:bg-muted"
                >
                  Previous
                </Link>
              )}
              <div className="px-3 py-1 text-sm font-medium">Page {page} of {totalPages}</div>
              {page < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...queryParams, page: String(page + 1) }).toString()}`}
                  className="px-3 py-1 text-sm rounded hover:bg-muted"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
