import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    environment: process.env.RAILWAY_ENVIRONMENT ?? "local",
    domain: process.env.RAILWAY_PUBLIC_DOMAIN ?? "localhost",
    nodeVersion: process.version,
    uptimeSecs: Math.floor(process.uptime()),
    memoryUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    timestamp: new Date().toISOString(),
  });
}
