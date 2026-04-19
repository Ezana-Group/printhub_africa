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
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    // 1. Partition IDs into CatalogueItems and ImportQueueItems
    // For now, we'll try to find them in both tables
    const [catalogueItems, importItems] = await Promise.all([
      prisma.catalogueItem.findMany({ where: { id: { in: ids } } }),
      prisma.catalogueImportQueue.findMany({ where: { id: { in: ids } } })
    ]);

    const catalogueIds = catalogueItems.map(i => i.id);
    const importIds = importItems.map(i => i.id);

    // ACTION: APPROVE
    if (action === "approve") {
      // Handle CatalogueItems (existing logic)
      for (const item of catalogueItems) {
        if (item.status === CatalogueStatus.LIVE) continue;
        try {
          await prisma.$transaction(async (tx) => {
             const uniqueSlug = await generateUniqueProductSlug(item.slug || item.name.toLowerCase().replace(/ /g, "-"));
             const uniqueSku = await generateNextProductSku(item.categoryId);
             
             const product = await tx.product.create({
               data: {
                 name: item.name,
                 slug: uniqueSlug,
                 description: item.description,
                 shortDescription: item.shortDescription,
                 categoryId: item.categoryId,
                 sku: uniqueSku,
                 images: item.photos ? (item.photos as any).map((p: any) => p.url) : [],
                 basePrice: item.basePriceKes || 0,
                 productType: ProductType.PRINT_ON_DEMAND,
                 availability: ProductAvailability.IN_STOCK,
                 isPOD: true,
                 catalogueItemId: item.id,
                 isActive: true,
                 tags: item.tags || [],
               }
             });

             await tx.catalogueItem.update({
               where: { id: item.id },
               data: {
                 status: CatalogueStatus.LIVE,
                 approvedById: userId,
                 approvedAt: new Date(),
                 productId: product.id,
               }
             });
          });
          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Catalogue ${item.name}: ${err.message}`);
        }
      }

      // Handle Imports (Notice: Imports usually need manual review for pricing/category)
      if (importIds.length > 0) {
        results.failed += importIds.length;
        results.errors.push(`${importIds.length} imports skipped: Bulk approval for imports requires manual review step.`);
      }

      auditAction = "CATALOGUE_BULK_APPROVE";
    }

    // ACTION: REJECT
    else if (action === "reject") {
      const [catUpdate, impUpdate] = await Promise.all([
        prisma.catalogueItem.updateMany({
          where: { id: { in: catalogueIds } },
          data: {
            status: CatalogueStatus.REJECTED,
            rejectedById: userId,
            rejectionReason: reason || "Bulk rejection",
          }
        }),
        prisma.catalogueImportQueue.updateMany({
          where: { id: { in: importIds } },
          data: {
            status: "REJECTED",
            reviewNotes: reason || "Bulk rejection",
          }
        })
      ]);
      results.success = catUpdate.count + impUpdate.count;
      auditAction = "CATALOGUE_BULK_REJECT";
    }

    // ACTION: ARCHIVE
    else if (action === "archive") {
      const catUpdate = await prisma.catalogueItem.updateMany({
        where: { id: { in: catalogueIds } },
        data: {
          status: CatalogueStatus.RETIRED,
          archivedById: userId,
          archivedAt: new Date(),
        }
      });
      results.success = catUpdate.count;
      // Imports don't have RETIRED, move to DRAFT if archived? 
      // Or just ignore.
      auditAction = "CATALOGUE_BULK_ARCHIVE";
    }

    await writeAudit({
      action: auditAction,
      category: "CATALOGUE",
      userId: userId,
      details: `Bulk ${action}: ${results.success} success, ${results.failed} failed. Reason: ${reason || "N/A"}`,
    });

    revalidateTag("catalogue");
    return NextResponse.json(results);
  } catch (error) {
    console.error("[APPROVAL_QUEUE_BULK]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
