import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";
import { CatalogueStatus } from "@prisma/client";

const bodySchema = z.object({
  status: z.enum(["LIVE", "PAUSED", "RETIRED", "DRAFT", "PENDING_REVIEW"]),
  rejectionReason: z.string().optional(),
});

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const role = (session?.user as { role?: string })?.role ?? "";
  const { id } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { status, rejectionReason } = parsed.data;

  if (status === "LIVE" && !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Only ADMIN or SUPER_ADMIN can approve items" }, { status: 403 });
  }

  try {
    const item = await prisma.catalogueItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: { status: CatalogueStatus; approvedBy?: string | null; approvedAt?: Date | null; rejectedBy?: string | null; rejectionReason?: string | null } = {
      status: status as CatalogueStatus,
    };
    if (status === "LIVE") {
      data.approvedBy = userId;
      data.approvedAt = new Date();
      data.rejectedBy = null;
      data.rejectionReason = null;
    } else if ((status === "RETIRED" || status === "DRAFT") && rejectionReason) {
      data.rejectedBy = userId;
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
