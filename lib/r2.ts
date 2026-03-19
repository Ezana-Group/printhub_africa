/**
 * Cloudflare R2 file storage — two-bucket setup.
 * printhub-uploads = private (signed URLs only)
 * printhub-public = public (CDN URL)
 * Client uploads via presigned PUT; never route large files through Next.js.
 *
 * CORS: For browser uploads to work, both buckets need CORS configured in
 * Cloudflare Dashboard → R2 → bucket → Settings → CORS policy. See docs/R2_CORS.md.
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
const R2_UPLOADS_BUCKET = process.env.R2_UPLOADS_BUCKET ?? "printhub-uploads";
const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET ?? "printhub-public";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

let _client: S3Client | null | undefined;

function getClient(): S3Client | null {
  if (_client !== undefined) return _client;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    _client = null;
    return null;
  }
  _client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

export const PRIVATE_BUCKET = R2_UPLOADS_BUCKET;
export const PUBLIC_BUCKET = R2_PUBLIC_BUCKET;
export const PUBLIC_CDN_URL = R2_PUBLIC_URL ?? "";

/** Folder paths in R2 — organises keys by use case. */
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
  | "brand/favicons"
  | "brand/og"
  | "site-images"
  | "categories/images"
  | "avatars"
  | "staff-profile"
  | "blog";

/** Generate a consistent storage key (date + optional user + safe filename + id). */
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

/** Presigned PUT URL for client to upload directly to R2. */
export async function createPresignedUploadUrl(params: {
  bucket: "private" | "public";
  key: string;
  contentType: string;
  maxSizeMB: number;
  expiresIn?: number;
}): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("R2 not configured");
  const bucket = params.bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 300,
  });
}

/** Presigned GET URL for private file download (e.g. 1hr). */
export async function createPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("R2 not configured");
  const command = new GetObjectCommand({
    Bucket: PRIVATE_BUCKET,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/** Delete object from R2. */
export async function deleteFile(
  bucket: "private" | "public",
  key: string
): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("R2 not configured");
  const b = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  await client.send(new DeleteObjectCommand({ Bucket: b, Key: key }));
}

/** Public file URL (CDN) for public bucket. */
export function publicFileUrl(key: string): string {
  const base = (R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  if (!base) throw new Error("R2_PUBLIC_URL not set");
  return `${base}/${key}`;
}

/** Public file URL when key is set; returns null if key or R2_PUBLIC_URL is missing. Use to resolve relative/broken image URLs. */
export function safePublicFileUrl(key: string | null | undefined): string | null {
  if (!key || !R2_PUBLIC_URL) return null;
  const base = R2_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/${key}`;
}

/** Check if file exists in R2 (for confirm step). */
export async function headObject(
  bucket: "private" | "public",
  key: string
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  const b = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  try {
    await client.send(new HeadObjectCommand({ Bucket: b, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export function isR2Configured(): boolean {
  return !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/** Get object body as Buffer (e.g. for virus scanning). Use sparingly. */
export async function getObjectBuffer(
  bucket: "private" | "public",
  key: string
): Promise<Buffer | null> {
  const client = getClient();
  if (!client) return null;
  const b = bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: b, Key: key })
    );
    const body = res.Body;
    if (!body) return null;
    return Buffer.from(await body.transformToByteArray());
  } catch {
    return null;
  }
}

/** Upload a buffer to R2 (e.g. server-side import from Printables). */
export async function putObjectBuffer(params: {
  bucket: "private" | "public";
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("R2 not configured");
  const b =
    params.bucket === "private" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
  await client.send(
    new PutObjectCommand({
      Bucket: b,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
}
