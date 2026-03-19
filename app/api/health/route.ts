import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const started = Date.now();
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { status: "ok", latencyMs: Date.now() - started };
  } catch (e) {
    checks.db = { status: "error", error: e instanceof Error ? e.message : "Database unreachable" };
  }

  const healthy = Object.values(checks).every((c) => c.status === "ok");
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
