import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import type { Category } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().optional().nullable(),
  parentId: z.string().nullable().optional(),
  image: z.union([z.string().url(), z.literal("")]).optional().nullable(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
});

type FlatCategory = Category & { _count: { products: number } };

type CategoryTreeNode = FlatCategory & { children: CategoryTreeNode[] };

/** Build nested tree from flat list. */
function buildTree(flat: FlatCategory[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, children: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort each level by sortOrder then name
  function sortLevel(nodes: CategoryTreeNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    nodes.forEach((n) => sortLevel(n.children));
  }
  sortLevel(roots);

  return roots;
}

export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });

  const tree = buildTree(categories as FlatCategory[]);
  return NextResponse.json(tree);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, slug, description, parentId, image, sortOrder, isActive, metaTitle, metaDescription } = parsed.data;

    // Check unique slug
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists." },
        { status: 400 }
      );
    }

    // Validate parentId if provided
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json({ error: "Parent category not found." }, { status: 400 });
      }

      // Enforce max depth = 3 (root = depth 0, max child = depth 2)
      const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
      const byId = new Map(allCats.map((c) => [c.id, c]));

      let depth = 1; // new category would be depth 1 if parent is root
      let cur: { id: string; parentId: string | null } | undefined = byId.get(parentId);
      while (cur?.parentId) {
        depth++;
        cur = byId.get(cur.parentId);
      }
      if (depth >= 3) {
        return NextResponse.json(
          { error: "Maximum category depth is 3 levels. This parent is already at the maximum depth." },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description ?? null,
        parentId: parentId ?? null,
        image: image === "" ? null : (image ?? null),
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        metaTitle: metaTitle ?? null,
        metaDescription: metaDescription ?? null,
      },
    });

    revalidateTag("categories");
    revalidateTag("homepage");
    revalidatePath("/shop");
    return NextResponse.json(category);
  } catch (e) {
    console.error("Create category error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
