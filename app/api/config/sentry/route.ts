import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { sentryDsn: true },
  });

  return NextResponse.json({ dsn: settings?.sentryDsn || null });
}
