import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { generateUniqueProductSlug, generateNextProductSku, generatePODSku } from "@/lib/product-utils";
import { revalidatePath, revalidateTag } from "next/cache";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      slug: preferredSlug,
      categoryId,
      basePrice, // This is expected to be a number
      description,
      shortDescription,
      isPOD = true,
      excludeColor = false,
      images = [],
      calculationData, // The full history entry or parts list
    } = body;

    if (!name || !categoryId || !basePrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Generate Slug
    const slugBase = preferredSlug?.trim() || slugify(name);
    const finalSlug = await generateUniqueProductSlug(slugBase);

    // 2. Generate SKU
    let sku = "";
    if (isPOD) {
      sku = await generatePODSku();
    } else {
      sku = await generateNextProductSku(categoryId);
    }

    // 3. Extract 3D specs from calculationData
    // calculationData is expected to be a HistoryEntry-like object
    let filamentWeight = 0;
    let printTimeStr = "";
    let materials: string[] = [];
    let colors: string[] = [];

    if (calculationData?.parts?.length) {
      filamentWeight = calculationData.parts.reduce((acc: number, p: any) => acc + (p.weightGrams * (p.quantity || 1)), 0);
      const totalHours = calculationData.parts.reduce((acc: number, p: any) => acc + (p.printTimeHours * (p.quantity || 1)), 0);
      
      // Format print time human-readable
      if (totalHours < 1) {
        printTimeStr = `${Math.round(totalHours * 60)} minutes`;
      } else {
        printTimeStr = `${totalHours.toFixed(1)} hours`;
      }

      if (!excludeColor) {
        materials = Array.from(new Set(calculationData.parts.map((p: any) => p.materialCode)));
        colors = Array.from(new Set(calculationData.parts.filter((p: any) => p.color).map((p: any) => p.color)));
      } else {
        // Still map materials if we want them, but the user specifically said "except the colour"
        materials = Array.from(new Set(calculationData.parts.map((p: any) => p.materialCode)));
        colors = [];
      }
    }

    // 4. Create Product
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        sku,
        categoryId,
        basePrice,
        description: description || "",
        shortDescription: shortDescription || "",
        productType: isPOD ? "POD" : "READYMADE_3D",
        isPOD,
        images: images,
        filamentWeightGrams: filamentWeight,
        printTimeEstimate: printTimeStr,
        materials: materials,
        colors: colors,
        isActive: false, // Saved as hidden — publish manually once ready for the shop
        // Carry over specifications
        specifications: {
          calculationId: calculationData?.id || null,
          partsCount: calculationData?.parts?.length || 0,
        }
      }
    });

    // 5. Link Images if provided via ProductImage model (if images array were URLs)
    // In our app/api/admin/products/route.ts, it just sets images: string[]
    // But we might also want to create ProductImage entries if our system uses them.
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((url: string, index: number) => ({
          productId: product.id,
          url,
          sortOrder: index,
          isPrimary: index === 0,
        }))
      });
    }

    revalidateTag("products");
    revalidatePath("/shop");

    return NextResponse.json({ success: true, productId: product.id, slug: product.slug });
  } catch (error: any) {
    console.error("Create product from calculation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
