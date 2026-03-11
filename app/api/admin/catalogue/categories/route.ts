import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const categories = await prisma.catalogueCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(categories.map((c) => ({ ...c, itemCount: c._count.items })));
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const slug = (data.slug?.trim() || slugify(data.name)) as string;
  const existing = await prisma.catalogueCategory.findUnique({ where: { slug } });
  let finalSlug = slug;
  if (existing) {
    let n = 1;
    while (await prisma.catalogueCategory.findUnique({ where: { slug: `${slug}-${n}` } })) n++;
    finalSlug = `${slug}-${n}`;
  }
  const cat = await prisma.catalogueCategory.create({
    data: {
      name: data.name,
      slug: finalSlug,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      icon: data.icon ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(cat);
}
