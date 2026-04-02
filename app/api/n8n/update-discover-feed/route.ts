import { NextRequest, NextResponse } from "next/server";
import { n8nGuard } from "@/lib/n8n-verify";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const DISCOVER_FEED_KEY = "discover-feed.json";

interface DiscoverItem {
  productId: string;
  productName: string;
  imageUrl: string;
  description: string;
  url: string;
  updatedAt: string;
}

async function getExistingFeed(): Promise<DiscoverItem[]> {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_PUBLIC_BUCKET!, Key: DISCOVER_FEED_KEY }));
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const guard = await n8nGuard(req);
  if (guard) return guard;

  try {
    const body = await req.clone().text();
    const { productId, productName, imageUrl, description, url } = JSON.parse(body);

    if (!productId || !productName || !imageUrl || !url) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const existing = await getExistingFeed();
    const idx = existing.findIndex((i) => i.productId === productId);
    const item: DiscoverItem = { productId, productName, imageUrl, description: description ?? "", url, updatedAt: new Date().toISOString() };

    if (idx >= 0) { existing[idx] = item; } else { existing.unshift(item); }
    const feed = existing.slice(0, 50);

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_PUBLIC_BUCKET!,
      Key: DISCOVER_FEED_KEY,
      Body: JSON.stringify({ items: feed, updatedAt: new Date().toISOString() }),
      ContentType: "application/json",
      CacheControl: "public, max-age=3600",
    }));

    let googleIndexed = false;
    if (process.env.GOOGLE_INDEXING_KEY) {
      try {
        const pingRes = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.GOOGLE_INDEXING_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
        });
        googleIndexed = pingRes.ok;
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ success: true, feedUrl: `${process.env.R2_PUBLIC_URL}/${DISCOVER_FEED_KEY}`, googleIndexed });
  } catch (err) {
    console.error("[update-discover-feed]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
