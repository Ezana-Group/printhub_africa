import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { putObjectBuffer, publicFileUrl } from "@/lib/r2";
import { CatalogueStatus, CatalogueLicense } from "@prisma/client";
import { z } from "zod";

const PRINTABLES_GRAPHQL = "https://api.printables.com/graphql/";

const PRINTABLES_MODEL_QUERY = `
  query GetModel($id: ID!) {
    model(id: $id) {
      id
      name
      summary
      description
      tags { name }
      license { id name spdxId }
      user { publicUsername handle }
      category { id name }
      images {
        filePath
        filePathOptimized
        rotation
        isMain
      }
      stls { filePath name }
      firstPublish
      likesCount
      makes { id }
    }
  }
`;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapPrintablesLicense(spdxId?: string): CatalogueLicense {
  const map: Record<string, CatalogueLicense> = {
    "CC0-1.0": "CC0",
    "CC-BY-4.0": "CC_BY",
    "CC-BY-SA-4.0": "CC_BY_SA",
    "CC-BY-ND-4.0": "CC_BY",
    "CC-BY-NC-4.0": "CC_BY",
    "CC-BY-NC-SA-4.0": "CC_BY",
    "CC-BY-NC-ND-4.0": "CC_BY",
  };
  return (map[spdxId ?? ""] as CatalogueLicense) ?? "CC_BY";
}

const bodySchema = z.object({
  url: z.string().url(),
  categoryId: z.string().min(1),
  nameOverride: z.string().max(300).optional(),
});

type ModelShape = {
  name: string;
  summary?: string;
  description?: string;
  tags?: { name: string }[];
  license?: { spdxId?: string };
  user?: { publicUsername?: string; handle?: string };
  images?: Array<{ filePath?: string; filePathOptimized?: string; isMain?: boolean }>;
  likesCount?: number;
  makes?: { id: string }[];
};

/** Fallback: fetch Printables page HTML and parse og: meta for title, description, image. */
async function fetchPrintablesPageFallback(url: string): Promise<ModelShape | null> {
  try {
    // [Printables] API — updated to use header auth + error handling
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" },
    });
    if (!res.ok) {
      const error = await res.text();
      console.error(`[Printables] Page fetch error ${res.status}:`, error);
      return null;
    }
    const html = await res.text();
    const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1];
    const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i)?.[1];
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i)?.[1];
    const name = (ogTitle && decodeHtmlEntities(ogTitle).trim()) || "Imported from Printables";
    const description = ogDesc ? decodeHtmlEntities(ogDesc).trim() : undefined;
    const images: ModelShape["images"] = ogImage
      ? [{ filePath: ogImage, filePathOptimized: ogImage, isMain: true }]
      : undefined;
    return { name, summary: description, description, images };
  } catch {
    return null;
  }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi({ permission: "products_edit" });
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid body", details: (e as Error).message },
      { status: 400 }
    );
  }

  const urlMatch = body.url.match(/printables\.com\/model\/([^/?#]+)/i);
  const urlSlug = urlMatch?.[1]?.trim(); // e.g. "444253-twisted-lamp-shade-for-ikea-skaftet"
  const modelId = urlSlug?.replace(/^(\d+).*/, "$1") ?? null; // numeric id "444253"
  if (!urlSlug || !modelId) {
    return NextResponse.json(
      { error: "Invalid Printables URL. Use e.g. https://www.printables.com/model/123456-name" },
      { status: 400 }
    );
  }

  const category = await prisma.catalogueCategory.findUnique({
    where: { id: body.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
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
      // [Printables] API — updated to use header auth + error handling
      const gqlRes = await fetch(PRINTABLES_GRAPHQL, {
        method: "POST",
        headers: graphqlHeaders,
        body: JSON.stringify({
          query: PRINTABLES_MODEL_QUERY,
          variables: { id: idVar },
        }),
      });
      if (!gqlRes.ok) {
        const error = await gqlRes.text();
        console.error(`[Printables] GraphQL error ${gqlRes.status}:`, error);
        continue;
      }
      gqlData = (await gqlRes.json()) as GqlResponse;
      model = gqlData?.data?.model ?? undefined;
      if (model?.name) break;
    }

    if (!model?.name) {
      const errMsg =
        gqlData?.errors?.[0]?.message ||
        (gqlData?.data?.model === null ? "Model not found (ID may have changed)." : "API returned no data.");
      console.error("Printables GraphQL:", errMsg, "id tried:", modelId, urlSlug, "errors:", gqlData?.errors);

      const fallback = await fetchPrintablesPageFallback(body.url);
      if (fallback) {
        model = fallback;
      } else {
        return NextResponse.json(
          { error: `Model not found on Printables or API returned no data. ${errMsg}` },
          { status: 404 }
        );
      }
    }
  } catch (e) {
    console.error("Printables GraphQL error:", e);
    const fallback = await fetchPrintablesPageFallback(body.url).catch(() => null);
    if (fallback) model = fallback;
    else
      return NextResponse.json(
        { error: "Failed to fetch from Printables" },
        { status: 502 }
      );
  }

  if (!model?.name) {
    return NextResponse.json({ error: "Could not load model data" }, { status: 502 });
  }

  const name = (body.nameOverride?.trim() || model.name).slice(0, 300);
  let slug = slugify(name);
  const existing = await prisma.catalogueItem.findUnique({ where: { slug } });
  if (existing) {
    let n = 1;
    while (await prisma.catalogueItem.findUnique({ where: { slug: `${slug}-${n}` } }))
      n++;
    slug = `${slug}-${n}`;
  }

  const item = await prisma.catalogueItem.create({
    data: {
      name,
      slug,
      description: (model.description ?? model.summary ?? "").slice(0, 50000) || null,
      shortDescription: (model.summary ?? model.description ?? "").slice(0, 500) || null,
      categoryId: body.categoryId,
      tags: model.tags?.map((t: { name: string }) => t.name) ?? [],
      sourceType: "PRINTABLES",
      sourceUrl: body.url,
      licenseType: mapPrintablesLicense(model.license?.spdxId),
      designerCredit: model.user?.publicUsername ?? model.user?.handle ?? null,
      status: CatalogueStatus.DRAFT,
      minQuantity: 1,
      maxQuantity: 50,
    },
  });

  const images = Array.isArray(model.images) ? model.images : [];
  const sorted = [...images].sort(
    (a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0)
  );
  const photoRecords: {
    catalogueItemId: string;
    url: string;
    storageKey: string;
    altText: string;
    sortOrder: number;
    isPrimary: boolean;
    sourceUrl: string | null;
  }[] = [];
  const limit = Math.min(sorted.length, 8);

  const resolveImageUrl = (path: string): string => {
    if (/^https?:\/\//i.test(path)) return path;
    const base = "https://www.printables.com";
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  };

  for (let i = 0; i < limit; i++) {
    const img = sorted[i];
    const rawPath = img.filePathOptimized || img.filePath;
    if (!rawPath || typeof rawPath !== "string") continue;
    const imageUrl = resolveImageUrl(rawPath);

    try {
      // [Printables] API — updated to use header auth + error handling
      const imgRes = await fetch(imageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" },
      });
      if (!imgRes.ok) {
        console.error(`[Printables] Image fetch error ${imgRes.status} for ${imageUrl}`);
        continue;
      }
      const imageBuffer = await imgRes.arrayBuffer();
      const imageBytes = Buffer.from(imageBuffer);
      const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const filename = `${slug}-${i + 1}.${ext}`;
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
        altText: `${name} — photo ${i + 1}`,
        sortOrder: i,
        isPrimary: !!img.isMain || i === 0,
        sourceUrl: imageUrl,
      });
    } catch (imgErr) {
      console.error(`Failed to download image ${i} for ${modelId}:`, imgErr);
    }
  }

  if (photoRecords.length > 0) {
    await prisma.catalogueItemPhoto.createMany({
      data: photoRecords,
    });
  }

  return NextResponse.json({
    success: true,
    item: { id: item.id, name: item.name, slug: item.slug },
    photosImported: photoRecords.length,
    photosAvailable: sorted.length,
    message: `Imported "${item.name}" with ${photoRecords.length} photos. Item is in DRAFT — edit and submit for review.`,
  });
}
