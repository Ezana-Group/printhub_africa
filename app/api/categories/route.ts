import { NextResponse } from "next/server";
import { getCachedCategories } from "@/lib/cache/unstable-cache";

export async function GET() {
  const categories = await getCachedCategories();
  const list = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  return NextResponse.json(list, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
