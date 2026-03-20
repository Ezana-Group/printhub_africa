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
    const model = await prisma.externalModel.findUnique({
      where: { id },
    });

    if (!model) {
      return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ model });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
