import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

function requireContentAdmin(auth: { role: string }) {
  if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const questions = await prisma.faq.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
    include: { category: { select: { name: true, slug: true } } },
  });
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "orders_view" });
  if (auth instanceof NextResponse) return auth;
  const forbidden = requireContentAdmin(auth);
  if (forbidden) return forbidden;

  const body = await req.json();
  const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
  const isPopular = typeof body.isPopular === "boolean" ? body.isPopular : false;

  if (!categoryId || !question || !answer) {
    return NextResponse.json(
      { error: "categoryId, question, and answer required" },
      { status: 400 }
    );
  }

  const faq = await prisma.faq.create({
    data: {
      categoryId,
      question,
      answer,
      sortOrder,
      isActive,
      isPopular,
      updatedBy: auth.session.user?.id ?? undefined,
    },
  });
  return NextResponse.json({ faq });
}
