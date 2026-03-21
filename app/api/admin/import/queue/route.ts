import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  try {
    const records = await prisma.catalogueItem.findMany({
      where: {
        status: {
          in: ["DRAFT", "PENDING_REVIEW"]
        },
        sourceType: {
          not: "MANUAL"
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        sourceType: true,
        licenseType: true,
        createdAt: true,
        status: true,
        photos: {
          where: { isPrimary: true },
          take: 1
        }
      }
    });

    const items = records.map(r => ({
      id: r.id,
      name: r.name,
      platform: r.sourceType,
      licenceType: r.licenseType,
      importedAt: r.createdAt,
      status: r.status,
      thumbnailUrl: r.photos.length > 0 ? r.photos[0].url : null
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
