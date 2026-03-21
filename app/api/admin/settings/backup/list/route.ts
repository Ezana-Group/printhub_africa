import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";

export async function GET(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  try {
    const backups = await prisma.backupRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(backups);
  } catch (error) {
    console.error("Failed to list backups:", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}
