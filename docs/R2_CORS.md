# R2 CORS configuration (browser uploads)

When the app uploads files from the browser via **presigned PUT URLs**, the browser sends a **preflight (OPTIONS)** request to the R2 URL (e.g. `*.r2.cloudflarestorage.com`). Without CORS rules on the bucket, R2 returns **403** and you see:

- `XMLHttpRequest cannot load https://...r2.cloudflarestorage.com/... due to access control checks`
- `Preflight response is not successful. Status code: 403`
- `Origin https://printhub.africa is not allowed by Access-Control-Allow-Origin. Status code: 403`
- `Failed to load resource: ... (line 0)`

**Fix:** Add a CORS policy to **both** R2 buckets used for uploads: **printhub-uploads** (private) and **printhub-public** (public). The CORS policy must include **all origins** that users upload from — this includes both `printhub.africa` (customer uploads from the quote page) and `admin.printhub.africa` (admin uploads from the admin portal).

## Steps (Cloudflare Dashboard)

1. Go to **Cloudflare Dashboard** → **R2** → select bucket (**printhub-uploads**).
2. Open **Settings** → **CORS policy**.
3. Paste the JSON below, then click **Save**.
4. Repeat for **printhub-public** bucket.

> ⚠️ Changes can take 1–2 minutes to propagate. Hard-refresh after saving.

## CORS policy (JSON) — apply to BOTH buckets

**Production + staging + local dev (recommended):**

```json
[
  {
    "AllowedOrigins": [
      "https://printhub.africa",
      "https://www.printhub.africa",
      "https://admin.printhub.africa",
      "https://test.ovid.co.ke",
      "https://www.test.ovid.co.ke",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Content-MD5"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

> **Key change from previous version:** `https://admin.printhub.africa` has been added so staff/admin uploads from the admin portal work without 403 errors.

**Permissive fallback — use temporarily to unblock if still failing:**

```json
[
  {
    "AllowedOrigins": [
      "https://printhub.africa",
      "https://www.printhub.africa",
      "https://admin.printhub.africa",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

- **AllowedMethods**: `PUT` is required for presigned uploads; `GET`/`HEAD` for download checks.
- **AllowedHeaders**: must include **Content-Type**. Use `["*"]` if you're still getting 403 — narrow it down after confirming uploads work.
- **AllowedOrigins**: must include every subdomain your users upload from. The presigned PUT goes directly from the browser to R2, bypassing Next.js, so the **R2 bucket itself** enforces the origin check — not your middleware.

## Why the 403 happens

The presigned PUT URL (`X-Amz-SignedHeaders=host`) is generated server-side. When the browser executes `fetch(presignedUrl, { method: "PUT", body: file })`, it first sends an OPTIONS preflight to R2. If R2's CORS policy doesn't list the request origin, R2 returns 403 — your Next.js middleware never sees this request.

## Verification

After applying the CORS policy, open DevTools → Network, try an upload, and confirm:
1. The `OPTIONS` preflight to `*.r2.cloudflarestorage.com` returns **200/204** with `Access-Control-Allow-Origin`.
2. The `PUT` request returns **200** with the file stored.
