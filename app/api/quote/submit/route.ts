import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  quoteType: z.enum(["large_format", "3d"]),
  estimatedTotal: z.number().min(0),
  inputs: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to submit a quote request." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Quote type and estimate required." },
        { status: 400 }
      );
    }

    const { quoteType, estimatedTotal, inputs } = parsed.data;
    const quantity = Number((inputs as { quantity?: number }).quantity) || 1;
    const material =
      (inputs as { materialSlug?: string; material?: string }).materialSlug ??
      (inputs as { materialSlug?: string; material?: string }).material ??
      null;
    const area = quoteType === "large_format" ? (inputs as { areaSqm?: number }).areaSqm ?? null : null;

    const quote = await prisma.printQuote.create({
      data: {
        userId: session.user.id,
        material: material ?? undefined,
        quantity,
        dimensions: { quoteType, ...inputs },
        area: area ?? undefined,
        estimatedCost: estimatedTotal,
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      message:
        "Your estimate has been saved. Our team will confirm the final price within 2 business days. You will not be charged until you accept the quote.",
    });
  } catch (e) {
    console.error("Quote submit error:", e);
    return NextResponse.json(
      { error: "Failed to submit quote. Please try again." },
      { status: 500 }
    );
  }
}
