import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const history = await prisma.catalogueItem.findMany({
      where: {
        importedById: auth.session.user.id,
        sourceType: { not: "MANUAL" }
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        sourceType: true,
        sourceUrl: true,
        createdAt: true,
        status: true,
      }
    });

    const mappedHistory = history.map(item => ({
      id: item.id,
      platform: item.sourceType,
      sourceUrl: item.sourceUrl,
      importedAt: item.createdAt,
      status: item.status
    }));

    return NextResponse.json({ history: mappedHistory });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
