import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json(); // May contain final editor updates

    const updated = await prisma.catalogueImportQueue.update({
      where: { id },
      data: {
        editorData: body,
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
        submittedById: (auth.session.user as any).id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error: any) {
    console.error("[SUBMIT_FOR_REVIEW_ERROR]", error);
    return NextResponse.json(
      { error: "SUBMISSION_FAILED", detail: error.message },
      { status: 500 }
    );
  }
}
