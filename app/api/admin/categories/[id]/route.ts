import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  image: z.union([z.string().url(), z.literal("")]).optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  parentId: z.string().nullable().optional(),
  showInNav: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    if (data.slug) {
      const existing = await prisma.category.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Another category already has this slug." },
          { status: 400 }
        );
      }
    }
    
    if (data.showInNav === true) {
      const navCount = await prisma.category.count({ where: { showInNav: true, id: { not: id } } });
      if (navCount >= 8) {
        return NextResponse.json(
          { error: "Navigation limit reached. Disable another category first (max 8 in nav)." },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.slug != null && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image === "" ? null : data.image }),
        ...(data.sortOrder != null && { sortOrder: data.sortOrder }),
        ...(data.isActive != null && { isActive: data.isActive }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.showInNav !== undefined && { showInNav: data.showInNav }),
      },
    });
    revalidateTag("categories");
    revalidateTag("homepage");
    revalidateTag("shop-nav");
    revalidatePath("/shop");
    return NextResponse.json(category);
  } catch (e) {
    console.error("Update category error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} product(s) use this category. Reassign or remove them first.` },
        { status: 400 }
      );
    }
    await prisma.category.delete({ where: { id } });
    revalidateTag("categories");
    revalidateTag("homepage");
    revalidatePath("/shop");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete category error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
