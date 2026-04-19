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
    // First try ExternalModel (legacy), then fall back to CatalogueImportQueue
    const model = await prisma.externalModel.findUnique({ where: { id } });
    if (model) {
      return NextResponse.json({ model });
    }

    const importQueue = await prisma.catalogueImportQueue.findUnique({ where: { id } });
    if (importQueue) {
      return NextResponse.json({ model: importQueue, isImportQueue: true });
    }

    return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    // Try deleting from CatalogueImportQueue first
    const importQueue = await prisma.catalogueImportQueue.findUnique({ where: { id } });
    if (importQueue) {
      await prisma.catalogueImportQueue.delete({ where: { id } });
      return NextResponse.json({ success: true, deleted: true });
    }

    // Fall back to ExternalModel
    const model = await prisma.externalModel.findUnique({ where: { id } });
    if (model) {
      await prisma.externalModel.delete({ where: { id } });
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
