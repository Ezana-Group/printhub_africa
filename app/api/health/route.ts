import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let dbHealthy = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { status: "ok", latencyMs: Date.now() - started };
    dbHealthy = true;
  } catch (e) {
    checks.db = { status: "error", error: e instanceof Error ? e.message : "Database unreachable" };
  }

  // We return 200 OK even if degraded (e.g. DB is down) to allow the container to boot.
  // Real-time monitoring should check the JSON body for "degraded" status.
  return NextResponse.json(
    {
      status: dbHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: 200 }
  );
}
