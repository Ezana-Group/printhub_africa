import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * INTERNAL USE ONLY: Bypasses role checks to let middleware fetch current security settings.
 * Protected by an internal secret header.
 */
export async function GET(req: Request) {
  const secret = req.headers.get("x-internal-secret");
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      passwordPolicy: true,
      twoFactorPolicy: true,
      sessionSettings: true,
      ipAllowlist: true,
      rateLimitSettings: true,
    },
  });

  return NextResponse.json(settings || {});
}
