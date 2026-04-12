/**
 * S3 / Cloudflare R2 file storage
 * R2 is S3-compatible: use R2_* env vars for Cloudflare, or AWS_* for AWS S3.
 * Use presigned URLs for uploads/downloads when using a bucket; store keys in DB.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

/** Presigned GET URL for private file download. Returns empty string if presigning is not possible (client/bucket not configured). */
export async function getSignedDownloadUrl(key: string): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  if (!client || !bucket) return "";
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Public URL for a stored key. Use R2_PUBLIC_URL when bucket has public read (e.g. printhub-public). Throws if not configured. */
export function getPublicUrl(key: string): string {
  const base = R2_PUBLIC_URL ?? AWS_PUBLIC_URL;
  if (!base) throw new Error("Missing R2_PUBLIC_URL or NEXT_PUBLIC_S3_URL for public file URLs. Set one in .env.");
  return `${base.replace(/\/$/, "")}/${key}`;
}

/** Whether R2/S3 is configured for server-side uploads. */
export function isUploadConfigured(): boolean {
  return getClient() !== null && getBucket() !== null;
}

/**
 * Upload a buffer to R2/S3 and return the public URL.
 * Requires R2_* or AWS_* env and R2_PUBLIC_URL or NEXT_PUBLIC_S3_URL for the returned URL.
 */
export async function uploadBuffer(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string> {
  const client = getClient();
  const bucket = getBucket();
  if (!client || !bucket) {
    throw new Error("R2 or S3 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_UPLOADS_BUCKET (and R2_PUBLIC_URL for public URLs).");
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return getPublicUrl(key);
}

/**
 * Upload a buffer to R2/S3 (private). Returns the key; use getSignedDownloadUrl(key) for a time-limited download link.
 */
export async function uploadPrivateBuffer(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
  const client = getClient();
  const bucket = getBucket();
  if (!client || !bucket) {
    throw new Error("R2 or S3 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_UPLOADS_BUCKET.");
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
  );
}

/**
 * Delete a file from R2/S3.
 */
export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  const bucket = getBucket();
  if (!client || !bucket) return;
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
