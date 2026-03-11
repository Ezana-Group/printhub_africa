import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

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

export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true, slug: true } },
    },
  });
  return NextResponse.json(categories);
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
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists." },
        { status: 400 }
      );
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
    return NextResponse.json(category);
  } catch (e) {
    console.error("Create category error:", e);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
