import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  const { confirmPhrase } = await req.json().catch(() => ({}));

  if (confirmPhrase !== "EXPORT DATA") {
    return NextResponse.json({ error: "Invalid confirmation phrase" }, { status: 400 });
  }

  try {
    // Collecting all key database tables for export
    const [orders, customers, products, settings, inventory, staff] = await Promise.all([
      prisma.order.findMany(),
      prisma.user.findMany({ where: { role: "CUSTOMER" } }),
      prisma.product.findMany(),
      prisma.businessSettings.findFirst(),
      prisma.inventoryItem?.findMany() || [],
      prisma.staff.findMany(),
    ]);

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      version: "3.1-unified",
      data: {
        orders,
        customers,
        products,
        settings,
        inventory,
        staff,
      }
    };

    await writeAudit({
      userId: auth.userId,
      action: "DANGER_ZONE_EXPORT_ALL_DATA",
      category: "DANGER",
      request: req,
    });

    // In a real production scenario, this might push to R2 and return a signed URL.
    // For this implementation, we return it as a JSON blob which the client can download as a file.
    return NextResponse.json({ 
      success: true, 
      filename: `printhub-full-export-${new Date().toISOString().split('T')[0]}.json`,
      payload: exportData 
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Failed to generate data export" }, { status: 500 });
  }
}
