import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET() {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const categories = await prisma.faqCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { faqs: true } } },
  });
  return NextResponse.json({
    categories: categories.map((c) => ({
      ...c,
      questionCount: c._count.faqs,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : name.toLowerCase().replace(/\s+/g, "-");
  const icon = typeof body.icon === "string" ? body.icon : null;
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const category = await prisma.faqCategory.create({
    data: { name, slug, icon, sortOrder, isActive: true },
  });
  return NextResponse.json({ category });
}
