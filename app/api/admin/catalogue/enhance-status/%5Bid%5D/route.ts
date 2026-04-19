import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const queueItem = await prisma.catalogueImportQueue.findUnique({
      where: { id },
      select: { aiEnhancementStatus: true }
    });

    if (!queueItem) {
      return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ status: queueItem.aiEnhancementStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
