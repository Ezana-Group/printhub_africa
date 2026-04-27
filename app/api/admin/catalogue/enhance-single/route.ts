import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { importId, productId } = await req.json();

    if (importId) {
      const queueItem = await prisma.catalogueImportQueue.findUnique({ where: { id: importId } });
      if (!queueItem) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });
      // AI enhancement not yet configured — wire to Claude API or similar
      return NextResponse.json({ triggered: false, message: "AI enhancement not configured" }, { status: 501 });
    }

    if (productId) {
      return NextResponse.json({ triggered: false, message: "AI enhancement not configured" }, { status: 501 });
    }

    return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  } catch (error: unknown) {
    console.error('[ENHANCE SINGLE ERROR]', error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
