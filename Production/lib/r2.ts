/**
 * Cloudflare R2 — two-bucket upload system
 * printhub-uploads (private) + printhub-public (public CDN)
 * Presigned URLs for upload/download; never route large files through Next.js.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

export const r2 =
  R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

export const PRIVATE_BUCKET = process.env.R2_UPLOADS_BUCKET ?? "printhub-uploads";
export const PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET ?? "printhub-public";
export const PUBLIC_CDN_URL = process.env.R2_PUBLIC_URL ?? "";

export type UploadFolder =
  | "designs/3d"
  | "designs/large-format"
  | "designs/quote"
  | "designs/general"
  | "catalogue/stl"
  | "proofs/payment"
  | "proofs/delivery"
  | "orders/attachments"
  | "invoices"
  | "products/images"
  | "catalogue/photos"
  | "brand/logos"
  | "brand/og"
  | "categories/images"
  | "avatars"
  | "blog";

/** Presigned upload URL — client uploads directly to R2. */
export async function createPresignedUploadUrl(params: {
  bucket: "private" | "public";
  key: string;
  contentType: string;
  maxSizeMB: number;
  expiresIn?: number;
}): Promise<string> {
  if (!r2) throw new Error("R2 not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.");
  const bucket = params.bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.maxSizeMB * 1024 * 1024,
  });
  return getSignedUrl(r2, command, { expiresIn: params.expiresIn ?? 300 });
}

/** Presigned download URL for private files. */
export async function createPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (!r2) throw new Error("R2 not configured.");
  const command = new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

/** Delete file from R2. */
export async function deleteFile(
  bucket: "private" | "public",
  key: string
): Promise<void> {
  if (!r2) throw new Error("R2 not configured.");
  const b = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  await r2.send(new DeleteObjectCommand({ Bucket: b, Key: key }));
}

/** Head object — check if file exists. */
export async function headObject(
  bucket: "private" | "public",
  key: string
): Promise<boolean> {
  if (!r2) return false;
  const b = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  try {
    await r2.send(new HeadObjectCommand({ Bucket: b, Key: key }));
    return true;
  } catch {
    return false;
  }
}
/** Get object body as Buffer (for virus scan, etc.). */
export async function getObjectBuffer(
  bucket: "private" | "public",
  key: string
): Promise<Buffer | null> {
  if (!r2) return null;
  const b = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  try {
    const response = await r2.send(new GetObjectCommand({ Bucket: b, Key: key }));
    const stream = response.Body;
    if (!stream) return null;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

/** Public CDN URL for a key in the public bucket. */
export function publicFileUrl(key: string): string {
  const base = PUBLIC_CDN_URL.replace(/\/$/, "");
  return `${base}/${key}`;
}

/** Generate a consistent storage key. */
export function generateStorageKey(params: {
  folder: UploadFolder;
  userId?: string;
  filename: string;
  ext: string;
}): string {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const date = new Date().toISOString().slice(0, 10);
  const safe = params.filename
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);
  const userSegment = params.userId ? `${params.userId}/` : "";
  return `${params.folder}/${date}/${userSegment}${safe}-${id}.${params.ext}`;
}
