import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

/**
 * GET /api/admin/channels/logs
 * Fetch recent marketing error logs.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "marketing_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    // @ts-ignore
    const logs = await prisma.marketingErrorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Admin Logs Error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/channels/logs
 * Clear all marketing error logs.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "marketing_edit" });
  if (auth instanceof NextResponse) return auth;

  try {
    // @ts-ignore
    await prisma.marketingErrorLog.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Logs Clear Error:", error);
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}
