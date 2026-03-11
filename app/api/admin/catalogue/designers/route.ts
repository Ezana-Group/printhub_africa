import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";
export async function GET() {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const designers = await prisma.catalogueDesigner.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(designers.map((d) => ({ ...d, itemCount: d._count.items })));
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  username: z.string().max(100).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
  profileUrl: z.string().url().optional().nullable(),
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
  const designer = await prisma.catalogueDesigner.create({
    data: {
      name: data.name,
      username: data.username ?? null,
      platform: data.platform ?? null,
      profileUrl: data.profileUrl ?? null,
    },
  });
  return NextResponse.json(designer);
}
