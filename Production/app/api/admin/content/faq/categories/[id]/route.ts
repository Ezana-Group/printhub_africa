import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await req.json();
  const data: { name?: string; slug?: string; icon?: string | null; sortOrder?: number; isActive?: boolean } = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.slug === "string") data.slug = body.slug.trim();
  if (body.icon !== undefined) data.icon = body.icon === null ? null : String(body.icon);
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const category = await prisma.faqCategory.update({
    where: { id },
    data,
  });
  return NextResponse.json({ category });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { id } = await params;
  const count = await prisma.faq.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Category has questions. Delete or move them first." },
      { status: 400 }
    );
  }
  await prisma.faqCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
