#!/usr/bin/env node
/**
 * Sets the CORS policy on both R2 buckets via the S3-compatible API.
 * Run: node scripts/set-r2-cors.mjs
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const R2_ENDPOINT        = "https://b9453de115fa8bcf7bc19b1c92209527.r2.cloudflarestorage.com";
const R2_ACCESS_KEY_ID   = "5eada27f2f839fd204e23ef24ad343b9";
const R2_SECRET_ACCESS_KEY = "a0e504e6fd9774af6145653e5ef0c9783a197002536c1bee3b4e7f0368f10d66";
const BUCKETS = ["printhub-uploads", "printhub-public"];

const client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const CORS_RULES = {
  CORSRules: [
    {
      AllowedOrigins: [
        "https://printhub.africa",
        "https://www.printhub.africa",
        "https://admin.printhub.africa",
        "https://test.ovid.co.ke",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Type", "Content-Length"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function setCors(bucket) {
  console.log(`\n→ Setting CORS on bucket: ${bucket}`);
  try {
    await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: CORS_RULES }));
    console.log(`  ✅ CORS set successfully on ${bucket}`);
  } catch (err) {
    console.error(`  ❌ Failed to set CORS on ${bucket}:`, err.message);
    process.exitCode = 1;
  }
}

async function verifyCors(bucket) {
  console.log(`\n→ Verifying CORS on bucket: ${bucket}`);
  try {
    const res = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    const rules = res.CORSRules ?? [];
    rules.forEach((r, i) => {
      console.log(`  Rule ${i + 1}:`);
      console.log(`    AllowedOrigins: ${r.AllowedOrigins?.join(", ")}`);
      console.log(`    AllowedMethods: ${r.AllowedMethods?.join(", ")}`);
      console.log(`    AllowedHeaders: ${r.AllowedHeaders?.join(", ")}`);
    });
  } catch (err) {
    console.error(`  ❌ Failed to read CORS on ${bucket}:`, err.message);
  }
}

console.log("=== Printhub R2 CORS Setup ===");
for (const bucket of BUCKETS) {
  await setCors(bucket);
}
console.log("\n=== Verifying applied CORS ===");
for (const bucket of BUCKETS) {
  await verifyCors(bucket);
}
console.log("\nDone.");
