import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const settings = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: { favicon: true, updatedAt: true },
  });

  const customFavicon = settings?.favicon?.trim();
  if (customFavicon) {
    const url = new URL(customFavicon, req.url);
    if (settings?.updatedAt) {
      url.searchParams.set("v", String(settings.updatedAt.getTime()));
    }
    return NextResponse.redirect(url.toString(), { status: 307 });
  }

  const fallbackPath = path.join(process.cwd(), "Logo", "white printhub logo.png");

  try {
    const file = await readFile(fallbackPath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/favicon.ico", req.url), { status: 307 });
  }
}
