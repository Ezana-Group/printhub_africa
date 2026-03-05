/**
 * S3 / Cloudflare R2 file storage
 * Use presigned URLs for client uploads; store keys in DB.
 */

const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const PUBLIC_URL = process.env.NEXT_PUBLIC_S3_URL;

export function getUploadUrl(key: string, contentType: string): Promise<string> {
  if (!process.env.AWS_ACCESS_KEY_ID || !BUCKET) {
    return Promise.resolve("");
  }
  // TODO: Use @aws-sdk/client-s3 getSignedUrl (PutObject)
  void key;
  void contentType;
  return Promise.resolve("");
}

export function getSignedDownloadUrl(key: string): Promise<string> {
  if (!process.env.AWS_ACCESS_KEY_ID || !BUCKET) {
    return Promise.resolve(PUBLIC_URL ? `${PUBLIC_URL}/${key}` : "");
  }
  // TODO: Use @aws-sdk/client-s3 getSignedUrl (GetObject)
  return Promise.resolve(PUBLIC_URL ? `${PUBLIC_URL}/${key}` : "");
}

export function getPublicUrl(key: string): string {
  return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;
}
