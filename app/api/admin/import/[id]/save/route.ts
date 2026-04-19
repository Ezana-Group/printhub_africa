import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.catalogueImportQueue.update({
      where: { id },
      data: {
        editorData: body,
        status: "DRAFT",
        reviewNotes: null, // Clear feedback once staff starts editing again
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error: any) {
    console.error("[SAVE_DRAFT_ERROR]", error);
    return NextResponse.json(
      { error: "SAVE_FAILED", detail: error.message },
      { status: 500 }
    );
  }
}
