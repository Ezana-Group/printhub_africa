import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { revalidateTag } from "next/cache";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const categories = await prisma.catalogueCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { items: true } }
      }
    });
    return NextResponse.json(categories);
  } catch (e) {
    console.error("Fetch catalogue categories error:", e);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, slug, description, isActive, sortOrder } = parsed.data;

    const existing = await prisma.catalogueCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A category with this slug already exists." }, { status: 400 });
    }

    const category = await prisma.catalogueCategory.create({
      data: {
        name,
        slug,
        description,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category);
  } catch (e) {
    console.error("Create catalogue category error:", e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const category = await prisma.catalogueCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (e) {
    console.error("Update catalogue category error:", e);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
