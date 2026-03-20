import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await prisma.externalModel.findMany({
      where: {
        status: {
          in: ["PENDING_REVIEW", "UNDER_REVIEW", "NEEDS_INFO"]
        }
      },
      orderBy: {
        importedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        platform: true,
        licenceType: true,
        importedAt: true,
        status: true,
        thumbnailUrl: true,
      }
    });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
