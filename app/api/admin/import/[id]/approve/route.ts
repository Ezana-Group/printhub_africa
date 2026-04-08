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
    let existingModel = await prisma.externalModel.findFirst({
      where: { id },
      select: { id: true, name: true, description: true, tags: true, categoryId: true }
    }) as any;

    let importQueue = null;
    if (!existingModel) {
      importQueue = await prisma.catalogueImportQueue.findFirst({
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
    const baseSlug = (data.name || "product").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Auto-generate unique slug
    const { generateUniqueProductSlug, generateNextProductSku } = await import("@/lib/product-utils");
    const finalSlug = await generateUniqueProductSlug(baseSlug || "imported-product");

    // Auto-generate SKU
    const sku = await generateNextProductSku(categoryId);

    // 1.5 Ensure all images are re-hosted on R2 (Safety check)
    const { downloadAndUploadImage } = await import("@/lib/import-utils");
    const { PUBLIC_CDN_URL } = await import("@/lib/r2");
    const finalImages: string[] = [];
    const imageUrlsToProcess = data.imageUrls || [];

    for (const imgUrl of imageUrlsToProcess) {
      // If it's already on our CDN, skip re-hosting
      if (PUBLIC_CDN_URL && imgUrl.startsWith(PUBLIC_CDN_URL)) {
        finalImages.push(imgUrl);
      } else {
        try {
          const newUrl = await downloadAndUploadImage(imgUrl);
          finalImages.push(newUrl || imgUrl);
        } catch (err) {
          console.error(`[Approve] Image re-host fail for ${imgUrl}:`, err);
          finalImages.push(imgUrl);
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug || finalSlug,
        sku: sku,
        description: data.description || data.fullDescription,
        shortDescription: data.shortDescription,
        categoryId: categoryId,
        productType: data.productType || "READYMADE_3D",
        images: finalImages,
        basePrice: data.basePrice || data.suggestedPriceMin || 0,
        comparePrice: data.comparePrice || data.suggestedPriceMax || null,
        stock: parseInt(data.stock) || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isFeatured: data.isFeatured || false,
        isPOD: data.isPOD || false,
        metaTitle: data.metaTitle || data.seoTitle || null,
        metaDescription: data.metaDescription || null,
        tags: data.tags || [],
        keyFeatures: data.keyFeatures || [],
        featuredThisWeek: data.featuredThisWeek || false,
        
        // Marketing Distribution Switches
        exportToGoogle: data.exportToGoogle ?? true,
        exportToGoogleBiz: data.exportToGoogleBiz ?? true,
        exportToLinkedIn: data.exportToLinkedIn ?? false,
        exportToMeta: data.exportToMeta ?? true,
        exportToPinterest: data.exportToPinterest ?? false,
        exportToTiktok: data.exportToTiktok ?? true,
        exportToX: data.exportToX ?? false,
        exportToGoogleDiscover: data.exportToGoogleDiscover ?? false,
        exportToInstagramReels: data.exportToInstagramReels ?? false,
        exportToInstagramStories: data.exportToInstagramStories ?? false,
        exportToJiji: data.exportToJiji ?? false,
        exportToTelegram: data.exportToTelegram ?? false,
        exportToWhatsappChannel: data.exportToWhatsappChannel ?? false,
        exportToWhatsappStatus: data.exportToWhatsappStatus ?? false,
        exportToYoutubeShorts: data.exportToYoutubeShorts ?? false,
        exportToAppleMaps: data.exportToAppleMaps ?? false,
        exportToBingPlaces: data.exportToBingPlaces ?? false,
        exportToGoogleMapsPost: data.exportToGoogleMapsPost ?? true,
        exportToLinkedInNewsletter: data.exportToLinkedInNewsletter ?? false,
        exportToMedium: data.exportToMedium ?? false,
        exportToNextdoor: data.exportToNextdoor ?? false,
        exportToOlxKenya: data.exportToOlxKenya ?? false,
        exportToPigiaMe: data.exportToPigiaMe ?? false,
        exportToReddit: data.exportToReddit ?? false,
        exportToSnapchat: data.exportToSnapchat ?? false,
        exportToYoutube: data.exportToYoutube ?? false,

        lastGoogleSync: null,
        lastMetaSync: null,
        lastTiktokSync: null,
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
          google: product.exportToGoogle,
          meta: product.exportToMeta,
          tiktok: product.exportToTiktok,
          linkedin: product.exportToLinkedIn,
          pinterest: product.exportToPinterest,
          x: product.exportToX,
          googleBusiness: product.exportToGoogleBiz,
          snapchat: product.exportToSnapchat,
          youtube: product.exportToYoutube,
          instagramStories: product.exportToInstagramStories,
          instagramReels: product.exportToInstagramReels,
          youtubeShorts: product.exportToYoutubeShorts,
          whatsappStatus: product.exportToWhatsappStatus,
          whatsappChannel: product.exportToWhatsappChannel,
          telegram: product.exportToTelegram,
          googleDiscover: product.exportToGoogleDiscover,
          googleMapsPost: product.exportToGoogleMapsPost,
          bingPlaces: product.exportToBingPlaces,
          appleMaps: product.exportToAppleMaps,
          pigiaMe: product.exportToPigiaMe,
          olxKenya: product.exportToOlxKenya,
          reddit: product.exportToReddit,
          linkedinNewsletter: product.exportToLinkedInNewsletter,
          medium: product.exportToMedium,
          nextdoor: product.exportToNextdoor,
          jiji: product.exportToJiji
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
