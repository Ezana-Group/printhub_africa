import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { ids, action, reason } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (auth.session.user as any).id;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {};
    let auditAction = "";

    switch (action) {
      case "approve":
        updateData = {
          status: CatalogueStatus.LIVE,
          approvedById: userId,
          approvedAt: new Date(),
          rejectedById: null,
          rejectionReason: null,
        };
        auditAction = "CATALOGUE_BULK_APPROVE";
        break;
      case "reject":
        updateData = {
          status: CatalogueStatus.DRAFT,
          rejectedById: userId,
          rejectionReason: reason || "Bulk rejection",
          approvedById: null,
          approvedAt: null,
        };
        auditAction = "CATALOGUE_BULK_REJECT";
        break;
      case "archive":
        updateData = {
          status: CatalogueStatus.RETIRED,
          archivedById: userId,
          archivedAt: new Date(),
        };
        auditAction = "CATALOGUE_BULK_ARCHIVE";
        break;
      case "restore":
        updateData = {
          status: CatalogueStatus.LIVE,
          archivedById: null,
          archivedAt: null,
        };
        auditAction = "CATALOGUE_BULK_RESTORE";
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { count } = await prisma.catalogueItem.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    await writeAudit({
      action: auditAction,
      category: "CATALOGUE",
      userId: userId,
      details: `Bulk ${action} for ${count} items. Reason: ${reason || "N/A"}`,
    });

    revalidateTag("catalogue");
    revalidatePath("/catalogue");

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("[APPROVAL_QUEUE_BULK]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
