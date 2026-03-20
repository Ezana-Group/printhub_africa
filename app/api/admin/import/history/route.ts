import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const history = await prisma.externalModel.findMany({
      where: {
        importedBy: auth.session.user.id,
      },
      orderBy: {
        importedAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        platform: true,
        sourceUrl: true,
        importedAt: true,
        status: true,
      }
    });

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
