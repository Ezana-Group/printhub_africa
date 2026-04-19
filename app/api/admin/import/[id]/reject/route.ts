import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleReject(req, params);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleReject(req, params);
}

async function handleReject(
  req: Request,
  paramsPromise: Promise<{ id: string }>
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await paramsPromise;
    const body = await req.json();
    const notes = body.notes || body.reason;

    if (!notes) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const updated = await prisma.catalogueImportQueue.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewNotes: notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error: any) {
    console.error("[REJECT_IMPORT_ERROR]", error);
    return NextResponse.json(
      { error: "REJECTION_FAILED", detail: error.message },
      { status: 500 }
    );
  }
}
