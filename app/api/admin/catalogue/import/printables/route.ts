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

  const match = body.url.match(/printables\.com\/model\/(\d+)/i);
  const modelId = match?.[1];
  if (!modelId) {
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

  let model: {
    name: string;
    summary?: string;
    description?: string;
    tags?: { name: string }[];
    license?: { spdxId?: string };
    user?: { publicUsername?: string; handle?: string };
    images?: Array<{
      filePath?: string;
      filePathOptimized?: string;
      isMain?: boolean;
    }>;
    likesCount?: number;
    makes?: { id: string }[];
  };

  try {
    const gqlRes = await fetch(PRINTABLES_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PRINTABLES_MODEL_QUERY,
        variables: { id: modelId },
      }),
    });
    const gqlData = await gqlRes.json();
    model = gqlData?.data?.model;
    if (!model?.name) {
      return NextResponse.json(
        { error: "Model not found on Printables or API returned no data" },
        { status: 404 }
      );
    }
  } catch (e) {
    console.error("Printables GraphQL error:", e);
    return NextResponse.json(
      { error: "Failed to fetch from Printables" },
      { status: 502 }
    );
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

  for (let i = 0; i < limit; i++) {
    const img = sorted[i];
    const imageUrl = img.filePathOptimized || img.filePath;
    if (!imageUrl || typeof imageUrl !== "string") continue;

    try {
      const imgRes = await fetch(imageUrl, {
        headers: { "User-Agent": "PrintHub/1.0 (catalogue import)" },
      });
      if (!imgRes.ok) continue;
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
