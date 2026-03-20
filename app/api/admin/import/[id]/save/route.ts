import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const data = await req.json();

  try {
    await prisma.externalModel.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        printInfo: data.printInfo,
        tags: data.tags,
        categoryId: data.categoryId || null,
        licenceType: data.licenceType,
        licenceVerified: data.licenceVerified,
        notes: data.internalNotes,
        imageUrls: data.imageUrls,
        thumbnailUrl: data.thumbnailUrl,
        status: "UNDER_REVIEW", // Mark as under review once saved
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: "SAVE_FAILED", detail: message }, { status: 500 });
  }
}
