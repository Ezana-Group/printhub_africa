/**
 * POST /api/admin/catalogue/[id]/import-photos-from-printables
 * Fetches images from the item's Printables link (sourceUrl) and adds them as CatalogueItemPhoto.
 * Optional body: { url?: string } to override sourceUrl.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { putObjectBuffer, publicFileUrl } from "@/lib/r2";

const PRINTABLES_GRAPHQL = "https://api.printables.com/graphql/";
const PRINTABLES_MODEL_QUERY = `
  query GetModel($id: ID!) {
    model(id: $id) {
      id name
      images { filePath filePathOptimized rotation isMain }
    }
  }
`;

type ModelShape = {
  name?: string;
  images?: Array<{ filePath?: string; filePathOptimized?: string; isMain?: boolean }>;
};

async function fetchPrintablesPageFallback(url: string): Promise<ModelShape | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PrintHub/1.0; +https://printhub.africa)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1];
    const images: ModelShape["images"] = ogImage
      ? [{ filePath: ogImage, filePathOptimized: ogImage, isMain: true }]
      : undefined;
    return { images };
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  if (!id || typeof id !== "string" || id.trim() === "") {
    return NextResponse.json(
      { error: "Catalogue item ID is missing. Re-open the item from the catalogue list and try again." },
      { status: 400 }
    );
  }
  const item = await prisma.catalogueItem.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, sourceUrl: true },
  });
  if (!item) {
    return NextResponse.json(
      { error: "Catalogue item not found. The item may have been deleted. Re-open the catalogue and try again." },
      { status: 404 }
    );
  }

  let url: string | null = item.sourceUrl;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.url === "string" && body.url.trim()) url = body.url.trim();
  } catch {
    // use item.sourceUrl
  }

  if (!url || !url.toLowerCase().includes("printables.com")) {
    return NextResponse.json(
      { error: "No Printables link set. Add a Printables URL in Details (Printables link) or send url in the request body." },
      { status: 400 }
    );
  }

  const urlMatch = url.match(/printables\.com\/model\/([^/?#]+)/i);
  const urlSlug = urlMatch?.[1]?.trim();
  const modelId = urlSlug?.replace(/^(\d+).*/, "$1") ?? null;
  if (!urlSlug || !modelId) {
    return NextResponse.json(
      { error: "Invalid Printables URL. Use e.g. https://www.printables.com/model/123456-name" },
      { status: 400 }
    );
  }

  let model: ModelShape | undefined;
  const graphqlHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; PrintHub/1.0; +https://printhub.africa)",
    Origin: "https://www.printables.com",
    Referer: "https://www.printables.com/",
  };

  try {
    for (const idVar of [modelId, urlSlug]) {
      const gqlRes = await fetch(PRINTABLES_GRAPHQL, {
        method: "POST",
        headers: graphqlHeaders,
        body: JSON.stringify({ query: PRINTABLES_MODEL_QUERY, variables: { id: idVar } }),
      });
      const gqlData = (await gqlRes.json()) as { data?: { model?: ModelShape }; errors?: Array<{ message?: string }> };
      model = gqlData?.data?.model ?? undefined;
      if (model?.images?.length) break;
    }
    if (!model?.images?.length) {
      const fallback = await fetchPrintablesPageFallback(url);
      if (fallback?.images?.length) model = fallback;
    }
  } catch (e) {
    console.error("Printables fetch error:", e);
    const fallback = await fetchPrintablesPageFallback(url).catch(() => null);
    if (fallback?.images?.length) model = fallback;
  }

  if (!model?.images?.length) {
    return NextResponse.json(
      { error: "Could not load images from Printables. Check the link or try again later." },
      { status: 404 }
    );
  }

  const images = [...model.images].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
  const resolveImageUrl = (path: string): string => {
    if (/^https?:\/\//i.test(path)) return path;
    const base = "https://www.printables.com";
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  };

  const existingCount = await prisma.catalogueItemPhoto.count({ where: { catalogueItemId: id } });
  const maxNew = Math.max(0, 8 - existingCount);
  const limit = Math.min(images.length, maxNew);
  const name = item.name ?? "Item";

  const photoRecords: {
    catalogueItemId: string;
    url: string;
    storageKey: string;
    altText: string;
    sortOrder: number;
    isPrimary: boolean;
    sourceUrl: string | null;
  }[] = [];

  for (let i = 0; i < limit; i++) {
    const img = images[i];
    const rawPath = img.filePathOptimized || img.filePath;
    if (!rawPath || typeof rawPath !== "string") continue;
    const imageUrl = resolveImageUrl(rawPath);

    try {
      const imgRes = await fetch(imageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PrintHub/1.0; +https://printhub.africa)" },
      });
      if (!imgRes.ok) continue;
      const imageBuffer = await imgRes.arrayBuffer();
      const imageBytes = Buffer.from(imageBuffer);
      const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const filename = `${item.slug}-${existingCount + i + 1}.${ext}`;
      const storageKey = `catalogue/photos/${item.id}/${filename}`;

      await putObjectBuffer({
        bucket: "public",
        key: storageKey,
        body: imageBytes,
        contentType,
      });

      const publicUrl = publicFileUrl(storageKey);
      photoRecords.push({
        catalogueItemId: item.id,
        url: publicUrl,
        storageKey,
        altText: `${name} — photo ${existingCount + i + 1}`,
        sortOrder: existingCount + i,
        isPrimary: existingCount === 0 && (!!img.isMain || i === 0),
        sourceUrl: imageUrl,
      });
    } catch (imgErr) {
      console.error(`Failed to download image ${i} for ${item.slug}:`, imgErr);
    }
  }

  if (photoRecords.length > 0) {
    await prisma.catalogueItemPhoto.createMany({ data: photoRecords });
  }

  return NextResponse.json({
    success: true,
    photosImported: photoRecords.length,
    photosAvailable: images.length,
    message: photoRecords.length
      ? `Imported ${photoRecords.length} photo(s) from Printables.`
      : "No new photos could be downloaded (slot limit or download failed).",
  });
}
