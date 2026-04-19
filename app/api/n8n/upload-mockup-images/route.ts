import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function downloadAndUploadToR2(imageUrl: string, key: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/png";

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_PUBLIC_BUCKET!,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const {
      productId,
      imageUrls,
    }: { productId: string; imageUrls: { url: string; platform: string; generator: string; prompt: string }[] } =
      JSON.parse(body);

    if (!productId || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const results: { platform: string; generator: string; r2Url: string; prompt: string }[] = [];

    for (const img of imageUrls) {
      const timestamp = Date.now();
      const key = `product-mockups/${productId}/${img.platform}-${img.generator}-${timestamp}.png`;
      const r2Url = await downloadAndUploadToR2(img.url, key);
      results.push({ platform: img.platform, generator: img.generator, r2Url, prompt: img.prompt });
    }

    await prisma.aiServiceLog.create({
      data: {
        service: "dalle3",
        operation: "mockup-generate",
        imageCount: results.filter((r) => r.generator === "dalle3").length,
        entityId: productId,
        entityType: "product",
        success: true,
      },
    });

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("[upload-mockup-images]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
