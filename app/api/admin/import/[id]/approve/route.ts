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
    const existingModel = await prisma.externalModel.findUnique({
      where: { id },
    });

    if (!existingModel) {
      return NextResponse.json({ error: "MODEL_NOT_FOUND" }, { status: 404 });
    }

    // 1. Create Product
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
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        productType: "READYMADE_3D",
        images: data.imageUrls,
        basePrice: data.basePrice,
        comparePrice: data.comparePrice || null,
        stock: 0,
        isActive: true, // Show in shop immediately upon approval
        tags: data.tags,
      }
    });

    // 2. Update ExternalModel
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

    revalidateTag("products");
    revalidatePath("/admin/catalogue/import");

    return NextResponse.json({ productId: product.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Approval failed";
    console.error("Approval Error:", error);
    return NextResponse.json({ error: "APPROVAL_FAILED", detail: message }, { status: 500 });
  }
}
