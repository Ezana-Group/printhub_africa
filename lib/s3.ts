/**
 * S3 / Cloudflare R2 file storage
 * R2 is S3-compatible: use R2_* env vars for Cloudflare, or AWS_* for AWS S3.
 * Use presigned URLs for uploads/downloads when using a bucket; store keys in DB.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 (Cloudflare) or AWS S3
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_UPLOADS_BUCKET = process.env.R2_UPLOADS_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Legacy AWS names (optional fallback)
const AWS_BUCKET = process.env.AWS_S3_BUCKET_NAME ?? R2_UPLOADS_BUCKET;
const AWS_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_URL ?? R2_PUBLIC_URL;

function getClient(): S3Client | null {
  if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
    return new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return null;
}

function getBucket(): string | null {
  return R2_UPLOADS_BUCKET ?? AWS_BUCKET ?? null;
}

/** Presigned PUT URL for client or server-side upload. Key stored in DB. */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  if (!client || !bucket) return "";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Presigned GET URL for private file download. */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  const publicUrl = R2_PUBLIC_URL ?? AWS_PUBLIC_URL;
  if (!client || !bucket) {
    return publicUrl ? `${publicUrl}/${key}` : "";
  }
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Public URL for a stored key. Use R2_PUBLIC_URL when bucket has public read (e.g. printhub-public). */
export function getPublicUrl(key: string): string {
  const base = R2_PUBLIC_URL ?? AWS_PUBLIC_URL;
  return base ? `${base.replace(/\/$/, "")}/${key}` : key;
}
