import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_review" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const data = await req.json();

  try {
    let existingModel = await prisma.externalModel.findUnique({
      where: { id },
    }) as any;

    let importQueue = null;
    if (!existingModel) {
      importQueue = await prisma.catalogueImportQueue.findUnique({
        where: { id },
      });
      if (!importQueue) {
        return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });
      }
      existingModel = importQueue;
    }

    // 1. Resolve or Create Category
    let categoryId = data.categoryId;
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { id: categoryId },
          { name: { equals: categoryId, mode: 'insensitive' } }
        ]
      }
    });

    if (!existingCategory && categoryId) {
      // Create new category on the fly
      const newCat = await prisma.category.create({
        data: {
          name: categoryId,
          slug: categoryId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          isActive: true
        }
      });
      categoryId = newCat.id;
    } else if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      // Fallback
      const defaultCat = await prisma.category.findFirst();
      categoryId = defaultCat?.id || "";
    }

    // 2. Create Product
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // Check slug uniqueness
    let finalSlug = slug;
    const existingProduct = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existingProduct) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.fullDescription || data.description,
        shortDescription: data.shortDescription,
        categoryId: categoryId,
        productType: "READYMADE_3D",
        images: data.imageUrls,
        basePrice: data.suggestedPriceMin || data.basePrice || 0,
        comparePrice: data.suggestedPriceMax || data.comparePrice || null,
        stock: 0,
        isActive: true, // Show in shop immediately upon approval
        tags: data.tags,
      }
    });

    // 2. Update Model Record
    if (importQueue) {
      await prisma.catalogueImportQueue.update({
        where: { id },
        data: {
          status: "APPROVED",
          productId: product.id,
        }
      });
    } else {
      await prisma.externalModel.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: auth.session.user.id,
          reviewedAt: new Date(),
          productId: product.id,
          name: data.name,
          description: data.description,
          printInfo: data.printInfo,
          tags: data.tags,
          categoryId: data.categoryId,
          licenceType: data.licenceType,
          licenceVerified: true,
          notes: data.internalNotes,
        }
      });
    }

    revalidateTag("products");
    revalidatePath("/admin/catalogue/import");
    revalidatePath("/shop");
    revalidatePath("/catalogue");

    // --- AUTOMATION TRIGGERS ---
    try {
      const { n8n } = await import("@/lib/n8n");
      
      // 1. Internal Staff Alert (WhatsApp/Telegram)
      void n8n.staffAlert({
        type: 'PRODUCT_PUBLISHED',
        title: `🚀 New Product Published: ${product.name}`,
        message: `A new product has been successfully imported and published to the shop.\n\nCategory: ${data.categoryId}\nPrice: KES ${data.basePrice}\nSource: ${importQueue ? 'Printables/External' : 'Manual Upload'}`,
        urgency: 'low',
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shop/product/${product.slug}`,
        targetRoles: ['STAFF', 'ADMIN']
      });

      // 2. Global Marketing Trigger (Socials/Search)
      void n8n.productPublished({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        description: product.description || "",
        price: Number(product.basePrice),
        currency: 'KES',
        imageUrls: data.imageUrls || [],
        category: data.categoryId,
        productUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shop/product/${product.slug}`,
        exportFlags: {
          google: true,
          meta: true,
          tiktok: true,
          linkedin: true,
          pinterest: true,
          x: true,
          googleBusiness: true,
          snapchat: true,
          youtube: true
        }
      });
    } catch (err) {
      console.error("n8n triggers failed:", err);
    }

    return NextResponse.json({ productId: product.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Approval failed";
    console.error("Approval Error:", error);
    return NextResponse.json({ error: "APPROVAL_FAILED", detail: message }, { status: 500 });
  }
}
