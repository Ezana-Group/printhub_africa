import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyN8nWebhook } from "@/lib/n8n-verify";

/**
 * Used by n8n to mark products as successfully exported to social media feeds.
 */
export async function POST(req: NextRequest) {
  try {
    const isValid = await verifyN8nWebhook(req);
    if (!isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, exportedPlatforms, failedPlatforms } = await req.json();

    await prisma.product.update({
      where: { id: productId },
      data: {
        lastExportedAt: new Date(),
        // Optional tracking of platforms
        metadata: {
          exportedPlatforms,
          failedPlatforms,
          lastSyncSource: "n8n",
        },
      },
    });

    if (failedPlatforms?.length > 0) {
      await prisma.auditLog.create({
        data: {
          category: "PRODUCT",
          action: "SOCIAL_EXPORT_FAILED",
          details: { productId, failedPlatforms },
          severity: "MEDIUM",
        },
      });
    }

    return NextResponse.json({ success: true, exportedAt: new Date() });
  } catch (err) {
    console.error("[mark-product-exported] Error updating product:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
