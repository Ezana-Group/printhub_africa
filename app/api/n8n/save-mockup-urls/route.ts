import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const {
      productId,
      mockups,
    }: {
      productId: string;
      mockups: { platform: string; imageUrl: string; generator: string; prompt: string }[];
    } = JSON.parse(body);

    if (!productId || !Array.isArray(mockups)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      mockups.map((m) =>
        prisma.productMockup.create({
          data: { productId, platform: m.platform, imageUrl: m.imageUrl, generator: m.generator, prompt: m.prompt },
        })
      )
    );

    return NextResponse.json({ success: true, count: created.length });
  } catch (err) {
    console.error("[save-mockup-urls]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
