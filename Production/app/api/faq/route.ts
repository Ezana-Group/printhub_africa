import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const categories = await prisma.faqCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      faqs: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
          isPopular: true,
        },
      },
    },
  });

  if (q) {
    const lower = q.toLowerCase();
    const filtered = categories.map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(lower) ||
          f.answer.toLowerCase().replace(/<[^>]+>/g, " ").includes(lower)
      ),
    })).filter((cat) => cat.faqs.length > 0);
    return NextResponse.json({ categories: filtered });
  }

  return NextResponse.json({ categories });
}
