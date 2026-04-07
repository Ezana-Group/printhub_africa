import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { CatalogueStatus, ProductType, ProductAvailability } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { revalidatePath, revalidateTag } from "next/cache";
import { generateUniqueProductSlug, generateNextProductSku } from "@/lib/product-utils";

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
    let auditAction = "";
    
    // ACTION: APPROVE (Requires creating Product records)
    if (action === "approve") {
      const items = await prisma.catalogueItem.findMany({
        where: { id: { in: ids }, status: { not: CatalogueStatus.LIVE } },
        include: { photos: { orderBy: { sortOrder: "asc" } } }
      });

      let successCount = 0;
      const errors: string[] = [];

      for (const item of items) {
        try {
          await prisma.$transaction(async (tx) => {
             // 1. Generate unique identifiers
             const uniqueSlug = await generateUniqueProductSlug(item.slug || item.name.toLowerCase().replace(/ /g, "-"));
             const uniqueSku = await generateNextProductSku(item.categoryId);
             
             // 2. Create the store Product
             const product = await tx.product.create({
               data: {
                 name: item.name,
                 slug: uniqueSlug,
                 description: item.description,
                 shortDescription: item.shortDescription,
                 categoryId: item.categoryId,
                 sku: uniqueSku,
                 images: item.photos.map(p => p.url),
                 basePrice: item.basePriceKes || 0,
                 productType: ProductType.PRINT_ON_DEMAND,
                 availability: ProductAvailability.IN_STOCK,
                 isPOD: true,
                 catalogueItemId: item.id,
                 isActive: true,
                 metaTitle: item.metaTitle,
                 metaDescription: item.metaDescription,
                 tags: item.tags,
               }
             });

             // 3. Link back and update status
             await tx.catalogueItem.update({
               where: { id: item.id },
               data: {
                 status: CatalogueStatus.LIVE,
                 approvedById: userId,
                 approvedAt: new Date(),
                 productId: product.id,
                 rejectedById: null,
                 rejectionReason: null,
               }
             });
          });
          successCount++;
        } catch (err) {
          console.error(`[BulkApprove] Failed for ${item.id}:`, err);
          errors.push(`${item.name}: ${err instanceof Error ? err.message : "Database error"}`);
        }
      }

      await writeAudit({
        action: "CATALOGUE_BULK_APPROVE",
        category: "CATALOGUE",
        userId: userId,
        details: `Bulk approve: ${successCount} successful, ${errors.length} failed.`,
      });

      revalidateTag("catalogue");
      return NextResponse.json({ 
        success: true, 
        count: successCount, 
        total: items.length,
        errors: errors.length > 0 ? errors : undefined 
      });
    }

    // OTHER ACTIONS (reject, archive, restore) - simple status updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateData: any = {};

    switch (action) {
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
    console.error("[APPROVAL_QUEUE_BULK_GLOBAL_FAIL]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
