import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { putObjectBuffer, publicFileUrl } from "@/lib/r2";

const PRINTABLES_GRAPHQL = "https://api.printables.com/graphql/";

const PRINTABLES_MODEL_QUERY = `
  query GetModel($id: ID!) {
    model(id: $id) {
      id
      name
      images {
        filePath
        filePathOptimized
        isMain
      }
    }
  }
`;

type ModelShape = {
  name?: string;
  images?: Array<{ filePath?: string; filePathOptimized?: string; isMain?: boolean }>;
};

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function fetchPrintablesPageFallback(url: string): Promise<ModelShape | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PrintHub/1.0; +https://printhub.africa)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1];
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1];
    const name = (ogTitle && decodeHtmlEntities(ogTitle).trim()) || "Imported from Printables";
    const images: ModelShape["images"] = ogImage
      ? [{ filePath: ogImage, filePathOptimized: ogImage, isMain: true }]
      : undefined;
    return { name, images };
  } catch {
    return null;
  }
}

/** POST: fetch images from the item's Printables link and add them as catalogue photos. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id: itemId } = await params;
  const item = await prisma.catalogueItem.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, slug: true, sourceUrl: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Catalogue item not found" }, { status: 404 });
  }

  const sourceUrl = item.sourceUrl?.trim() ?? "";
  const urlMatch = sourceUrl.match(/printables\.com\/model\/([^/?#]+)/i);
  const urlSlug = urlMatch?.[1]?.trim();
  const modelId = urlSlug?.replace(/^(\d+).*/, "$1") ?? null;
  if (!urlSlug || !modelId) {
    return NextResponse.json(
      {
        error:
          "No valid Printables link on this item. Save a Printables model URL in the Details tab (e.g. https://www.printables.com/model/123456-name), then try again.",
      },
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
  type GqlResponse = { data?: { model?: ModelShape }; errors?: Array<{ message?: string }> };

  try {
    let gqlData: GqlResponse | null = null;
    for (const idVar of [modelId, urlSlug]) {
      const gqlRes = await fetch(PRINTABLES_GRAPHQL, {
        method: "POST",
        headers: graphqlHeaders,
        body: JSON.stringify({ query: PRINTABLES_MODEL_QUERY, variables: { id: idVar } }),
      });
      gqlData = (await gqlRes.json()) as GqlResponse;
      model = gqlData?.data?.model ?? undefined;
      if (model?.name || (model?.images && model.images.length > 0)) break;
    }

    if (!model?.images?.length) {
      const fallback = await fetchPrintablesPageFallback(sourceUrl);
      if (fallback?.images?.length) model = fallback;
    }

    if (!model?.images?.length) {
      return NextResponse.json(
        { error: "Could not fetch images from Printables. The model may be private or the link may have changed." },
        { status: 404 }
      );
    }

    const images = [...model.images].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
    const limit = Math.min(images.length, 8);
    const name = item.name || "Catalogue item";
    const slug = item.slug || "item";
    const resolveImageUrl = (path: string): string => {
      if (/^https?:\/\//i.test(path)) return path;
      const base = "https://www.printables.com";
      return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
    };

    const photoRecords: {
      catalogueItemId: string;
      url: string;
      storageKey: string;
      altText: string;
      sortOrder: number;
      isPrimary: boolean;
      sourceUrl: string | null;
    }[] = [];

    const existingCount = await prisma.catalogueItemPhoto.count({
      where: { catalogueItemId: item.id },
    });
    const sortOffset = existingCount;

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
        const filename = `${slug}-printables-${sortOffset + i + 1}.${ext}`;
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
          altText: `${name} — photo ${sortOffset + i + 1}`,
          sortOrder: sortOffset + i,
          isPrimary: !!img.isMain || (sortOffset === 0 && i === 0),
          sourceUrl: imageUrl,
        });
      } catch (imgErr) {
        console.error(`Sync Printables photo ${i} for item ${item.id}:`, imgErr);
      }
    }

    if (photoRecords.length > 0) {
      await prisma.catalogueItemPhoto.createMany({ data: photoRecords });
    }

    return NextResponse.json({
      success: true,
      photosImported: photoRecords.length,
      photosAvailable: images.length,
      message:
        photoRecords.length > 0
          ? `Added ${photoRecords.length} photo(s) from Printables.`
          : "No new photos could be downloaded from Printables.",
    });
  } catch (e) {
    console.error("Sync Printables photos error:", e);
    return NextResponse.json(
      { error: "Failed to fetch or save images from Printables." },
      { status: 502 }
    );
  }
}
