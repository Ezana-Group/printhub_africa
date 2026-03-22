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

/** Collect all descendant IDs of a given category (recursive). */
async function getDescendantIds(categoryId: string): Promise<Set<string>> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const childrenByParent = new Map<string, string[]>();
  for (const c of all) {
    if (c.parentId) {
      if (!childrenByParent.has(c.parentId)) childrenByParent.set(c.parentId, []);
      childrenByParent.get(c.parentId)!.push(c.id);
    }
  }

  const result = new Set<string>();
  const queue = [categoryId];
  while (queue.length) {
    const cur = queue.shift()!;
    const children = childrenByParent.get(cur) ?? [];
    for (const child of children) {
      result.add(child);
      queue.push(child);
    }
  }
  return result;
}

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

    // Validate re-parenting: prevent circular references
    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        return NextResponse.json(
          { error: "A category cannot be its own parent." },
          { status: 400 }
        );
      }
      // Ensure the new parent is not a descendant of this category
      const descendants = await getDescendantIds(id);
      if (descendants.has(data.parentId)) {
        return NextResponse.json(
          { error: "Cannot re-parent: the selected parent is a descendant of this category (circular reference)." },
          { status: 400 }
        );
      }

      // Enforce max depth = 3
      const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
      const byId = new Map(allCats.map((c) => [c.id, c]));

      // Depth of new parent
      let parentDepth = 0;
      let cur: { id: string; parentId: string | null } | undefined = byId.get(data.parentId);
      while (cur?.parentId) {
        parentDepth++;
        cur = byId.get(cur.parentId);
      }

      // Depth of deepest descendant relative to this node
      const descendantList = await prisma.category.findMany({
        where: { id: { in: [...descendants] } },
        select: { id: true, parentId: true },
      });
      let maxRelativeDepth = 0;
      function calcRelDepth(nodeId: string, depth: number) {
        maxRelativeDepth = Math.max(maxRelativeDepth, depth);
        for (const d of descendantList) {
          if (d.parentId === nodeId) calcRelDepth(d.id, depth + 1);
        }
      }
      calcRelDepth(id, 1);

      if (parentDepth + maxRelativeDepth >= 3) {
        return NextResponse.json(
          { error: "Re-parenting would exceed the maximum category depth of 3 levels." },
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
    // Block deletion if active children exist
    const childCount = await prisma.category.count({
      where: { parentId: id, isActive: true },
    });
    if (childCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: this category has ${childCount} active subcategorie(s). Deactivate or delete them first.`,
        },
        { status: 400 }
      );
    }

    // Block deletion if active products are assigned
    const productCount = await prisma.product.count({
      where: { categoryId: id, isActive: true },
    });
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${productCount} active product(s) are assigned to this category. Reassign or deactivate them first.`,
        },
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
