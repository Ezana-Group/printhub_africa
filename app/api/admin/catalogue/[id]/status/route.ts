import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";
import { CatalogueStatus } from "@prisma/client";

const bodySchema = z.object({
  status: z.enum(["LIVE", "PAUSED", "RETIRED", "DRAFT", "PENDING_REVIEW"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const session = await getServerSession(authOptionsAdmin);
  const userId = session?.user?.id ?? null;
  const { id } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status, rejectionReason } = parsed.data;

  try {
    const item = await prisma.catalogueItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      status: status as CatalogueStatus,
    };
    if (status === "LIVE") {
      data.approvedBy = userId ? { connect: { id: userId } } : undefined;
      data.approvedAt = new Date();
      data.rejectedBy = { disconnect: true };
      data.rejectionReason = null;
    } else if ((status === "RETIRED" || status === "DRAFT") && rejectionReason) {
      data.rejectedBy = userId ? { connect: { id: userId } } : undefined;
      data.rejectionReason = rejectionReason;
    }

    const updated = await prisma.catalogueItem.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Update catalogue status error:", e);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
