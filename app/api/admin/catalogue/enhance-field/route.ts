import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { importId, field } = await req.json();
    if (!importId || !field) return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });

    const queueItem = await prisma.catalogueImportQueue.findUnique({ where: { id: importId } });
    if (!queueItem) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });

    // Reset processing status — AI enhancement not yet configured
    await prisma.catalogueImportQueue.update({
      where: { id: importId },
      data: { aiEnhancementStatus: "pending" }
    });

    return NextResponse.json({ success: false, message: "AI enhancement not configured" }, { status: 501 });
  } catch (error: unknown) {
    console.error('[ENHANCE FIELD ERROR]', error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
